import type { Note } from "@/lib/types";

export function notesToMarkdown(notes: Note[]): string {
  return notes
    .map((note, index) => {
      return [
        `## ${index + 1}`,
        `原文：${note.text || ""}`,
        `原文翻译：${note.translation || ""}`,
        `语境句：${note.context || ""}`,
        `语境翻译：${note.contextTranslation || ""}`,
        `备注：${note.userNote || ""}`
      ].join("\n");
    })
    .join("\n\n");
}

export function exportMarkdown(notes: Note[]): void {
  const markdown = notesToMarkdown(notes);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mypicks-notes.md";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
