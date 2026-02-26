import type { Note, ReviewResult, TranslationResult } from "@/lib/types";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function translateSelection(input: {
  selectedText: string;
  contextSentence: string;
}): Promise<TranslationResult> {
  await wait(500);

  const selectedTranslation = `[Mock翻译] ${input.selectedText}`;
  const contextTranslation = `[Mock语境翻译] ${input.contextSentence}`;

  return { selectedTranslation, contextTranslation };
}

export async function askAI(input: {
  selectedText: string;
  contextSentence: string;
  fullText: string;
  question: string;
}): Promise<{ answer: string }> {
  await wait(800);

  const preview = input.fullText.slice(0, 80).replace(/\s+/g, " ");
  return {
    answer: [
      "[Mock AI回答]",
      `问题：${input.question}`,
      `选区：${input.selectedText}`,
      `语境：${input.contextSentence}`,
      `全文预览：${preview}${input.fullText.length > 80 ? "..." : ""}`
    ].join("\n")
  };
}

export async function reviewAI(input: {
  fullText: string;
  notes: Note[];
}): Promise<ReviewResult> {
  await wait(900);

  return {
    summary: `你已记录 ${input.notes.length} 条笔记。建议先复盘高频重复词与难句结构。`,
    missingPoints: [
      "可补充全文主旨一句话总结",
      "检查是否覆盖了转折句/结论句",
      "标记1-2个可复用表达"
    ],
    potentialIssues: [
      input.fullText.length > 10000 ? "全文较长，AI复盘可能不够细" : "无明显长度问题",
      "部分笔记可能只有词级翻译，缺少用法说明"
    ],
    practice: [
      "尝试用自己的话复述全文核心观点（3句以内）",
      "从笔记中选2条造句",
      "回看语境句，确认翻译是否贴合语气"
    ],
    perNoteAdditions: input.notes.slice(0, 5).map((note, index) => {
      return `#${index + 1} 可补：词性/搭配/语气（${note.text.slice(0, 20)}${note.text.length > 20 ? "..." : ""}）`;
    })
  };
}
