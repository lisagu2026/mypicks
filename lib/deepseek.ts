import type { Note, ReviewResult, TranslationResult } from "@/lib/types";

type DeepSeekMessage = {
  role: "system" | "user";
  content: string;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

const REQUEST_TIMEOUT_MS = 30000;

function getConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  if (!apiKey) {
    throw new Error("Missing DEEPSEEK_API_KEY. Add it to .env.local before calling AI APIs.");
  }

  return { apiKey, baseUrl, model };
}

function stripCodeFence(content: string): string {
  const trimmed = content.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractFirstJsonObject(content: string): string | null {
  const normalized = stripCodeFence(content);

  let depth = 0;
  let start = -1;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === "\\") {
        isEscaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        start = i;
      }
      depth += 1;
      continue;
    }

    if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        return normalized.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parseModelJsonObject(content: string): unknown {
  const normalized = stripCodeFence(content);

  try {
    return JSON.parse(normalized) as unknown;
  } catch {
    const extracted = extractFirstJsonObject(normalized);
    if (!extracted) {
      throw new Error("Model did not return valid JSON.");
    }

    try {
      return JSON.parse(extracted) as unknown;
    } catch {
      throw new Error("Model returned malformed JSON.");
    }
  }
}

function expectString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Model JSON is missing a valid "${field}" string.`);
  }

  return value.trim();
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim());
}

function parseTranslationResult(content: string): TranslationResult {
  const parsed = parseModelJsonObject(content);
  if (!isRecord(parsed)) {
    throw new Error("Model JSON for translation must be an object.");
  }

  return {
    selectedTranslation: expectString(parsed.selectedTranslation, "selectedTranslation"),
    contextTranslation: expectString(parsed.contextTranslation, "contextTranslation")
  };
}

function parseReviewResult(content: string): ReviewResult {
  const parsed = parseModelJsonObject(content);
  if (!isRecord(parsed)) {
    throw new Error("Model JSON for review must be an object.");
  }

  return {
    summary: expectString(parsed.summary, "summary"),
    missingPoints: toStringArray(parsed.missingPoints),
    potentialIssues: toStringArray(parsed.potentialIssues),
    practice: toStringArray(parsed.practice),
    perNoteAdditions: toStringArray(parsed.perNoteAdditions)
  };
}

function parseDeepSeekResponseBody(body: string): DeepSeekResponse {
  try {
    return JSON.parse(body) as DeepSeekResponse;
  } catch {
    return {};
  }
}

async function callDeepSeek(messages: DeepSeekMessage[], temperature = 0.2): Promise<string> {
  const { apiKey, baseUrl, model } = getConfig();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature,
        messages,
        stream: false
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`DeepSeek request failed: ${message}`);
  }

  const rawBody = await response.text();
  const data = parseDeepSeekResponseBody(rawBody);

  if (!response.ok) {
    const fallback = rawBody.trim().slice(0, 200);
    throw new Error(data.error?.message || fallback || `DeepSeek request failed: ${response.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("DeepSeek returned an empty response.");
  }

  return content;
}

export async function translateWithDeepSeek(input: {
  selectedText: string;
  contextSentence: string;
}): Promise<TranslationResult> {
  const content = await callDeepSeek(
    [
      {
        role: "system",
        content:
          'You translate foreign-language reading notes. Return JSON only: {"selectedTranslation":"...","contextTranslation":"..."}'
      },
      {
        role: "user",
        content: [
          "Translate the selected text and the context sentence into natural Chinese.",
          "Keep the wording concise and faithful.",
          `selectedText: ${input.selectedText}`,
          `contextSentence: ${input.contextSentence}`
        ].join("\n")
      }
    ],
    0.1
  );

  return parseTranslationResult(content);
}

export async function askWithDeepSeek(input: {
  selectedText: string;
  contextSentence: string;
  fullText: string;
  question: string;
}): Promise<{ answer: string }> {
  const answer = await callDeepSeek(
    [
      {
        role: "system",
        content:
          "You answer questions about a reading passage. Reply in concise Chinese. Use the selected text and context first, then use the full text only if needed."
      },
      {
        role: "user",
        content: [
          `selectedText: ${input.selectedText}`,
          `contextSentence: ${input.contextSentence}`,
          `question: ${input.question}`,
          "fullText:",
          input.fullText
        ].join("\n")
      }
    ],
    0.3
  );

  return { answer };
}

export async function reviewWithDeepSeek(input: {
  fullText: string;
  notes: Note[];
}): Promise<ReviewResult> {
  const notesSummary = input.notes
    .map((note, index) => {
      return [
        `#${index + 1}`,
        `text: ${note.text}`,
        `translation: ${note.translation}`,
        `context: ${note.context}`,
        `userNote: ${note.userNote}`
      ].join("\n");
    })
    .join("\n\n");

  const content = await callDeepSeek(
    [
      {
        role: "system",
        content:
          'You review reading notes. Return JSON only with this shape: {"summary":"...","missingPoints":["..."],"potentialIssues":["..."],"practice":["..."],"perNoteAdditions":["..."]}'
      },
      {
        role: "user",
        content: [
          "Review the reading notes and provide concise study guidance in Chinese.",
          "fullText:",
          input.fullText,
          "",
          "notes:",
          notesSummary || "No notes yet."
        ].join("\n")
      }
    ],
    0.3
  );

  return parseReviewResult(content);
}
