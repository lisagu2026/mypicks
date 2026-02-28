import type { Note, ReviewResult, TranslationResult } from "@/lib/types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      // Fall back to the default message when the error response is not JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function translateSelection(input: {
  selectedText: string;
  contextSentence: string;
}): Promise<TranslationResult> {
  return postJson<TranslationResult>("/api/translate", input);
}

export async function askAI(input: {
  selectedText: string;
  contextSentence: string;
  fullText: string;
  question: string;
}): Promise<{ answer: string }> {
  return postJson<{ answer: string }>("/api/ask", input);
}

export async function reviewAI(input: {
  fullText: string;
  notes: Note[];
}): Promise<ReviewResult> {
  return postJson<ReviewResult>("/api/review", input);
}
