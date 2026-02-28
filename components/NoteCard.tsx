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
    <article className="rounded-[24px] border border-line/55 bg-[#fbfdff] px-4 py-4 shadow-[0_14px_34px_-30px_rgba(35,57,92,0.18)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="rounded-full bg-white px-2.5 py-1 text-xs text-muted">#{props.index + 1}</p>
        <button
          type="button"
          onClick={() => props.onDelete(props.note.id)}
          className="rounded-full px-2.5 py-1 text-xs text-muted transition hover:bg-white"
        >
          删除
        </button>
      </div>

      <div className="space-y-2.5 text-sm">
        <div>
          <p className="mb-1 text-xs text-muted">原文</p>
          <pre className="whitespace-pre-wrap break-words font-sans leading-6">{props.note.text}</pre>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted">原文翻译</p>
          <pre className="whitespace-pre-wrap break-words font-sans leading-6 text-[#35567f]">
            {props.note.translation}
          </pre>
        </div>
        <details className="rounded-2xl bg-white px-3 py-2.5">
          <summary className="cursor-pointer text-xs text-muted">语境句</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans leading-6">{props.note.context || "（空）"}</pre>
        </details>
        <details className="rounded-2xl bg-white px-3 py-2.5">
          <summary className="cursor-pointer text-xs text-muted">语境翻译</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words font-sans leading-6 text-[#35567f]">
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
            className="w-full rounded-2xl border border-line/55 bg-white p-3 outline-none transition focus:ring-4 focus:ring-[#3a72b7]/10"
          />
        </div>
      </div>
    </article>
  );
}
