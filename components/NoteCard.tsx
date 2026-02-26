"use client";

import type { Note } from "@/lib/types";

type NoteCardProps = {
  index: number;
  note: Note;
  onChangeUserNote: (id: string, value: string) => void;
  onDelete: (id: string) => void;
};

export function NoteCard(props: NoteCardProps) {
  return (
    <article className="rounded-xl border border-line bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-xs text-muted">#{props.index + 1}</p>
        <button
          type="button"
          onClick={() => props.onDelete(props.note.id)}
          className="rounded-md px-2 py-1 text-xs text-[#8a3f30] hover:bg-[#f7ebe8]"
        >
          删除
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <p className="text-xs text-muted">原文</p>
          <pre className="whitespace-pre-wrap break-words font-sans">{props.note.text}</pre>
        </div>
        <div>
          <p className="text-xs text-muted">原文翻译</p>
          <pre className="whitespace-pre-wrap break-words font-sans">{props.note.translation}</pre>
        </div>
        <details className="rounded-md border border-line bg-paper p-2">
          <summary className="cursor-pointer text-xs text-muted">语境句</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans">{props.note.context || "（空）"}</pre>
        </details>
        <details className="rounded-md border border-line bg-paper p-2">
          <summary className="cursor-pointer text-xs text-muted">语境翻译</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans">
            {props.note.contextTranslation || "（空）"}
          </pre>
        </details>
        <div>
          <label className="mb-1 block text-xs text-muted" htmlFor={`user-note-${props.note.id}`}>
            备注
          </label>
          <textarea
            id={`user-note-${props.note.id}`}
            value={props.note.userNote}
            onChange={(e) => props.onChangeUserNote(props.note.id, e.target.value)}
            rows={3}
            className="w-full rounded-md border border-line bg-[#fffefb] p-2 outline-none focus:border-accent"
          />
        </div>
      </div>
    </article>
  );
}
