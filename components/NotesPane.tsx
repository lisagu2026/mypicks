"use client";

import { NoteCard } from "@/components/NoteCard";
import type { Note } from "@/lib/types";

type NotesPaneProps = {
  notes: Note[];
  onChangeUserNote: (id: string, value: string) => void;
  onDeleteNote: (id: string) => void;
  onClearNotes: () => void;
};

export function NotesPane(props: NotesPaneProps) {
  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-medium">笔记区</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{props.notes.length} 条</span>
          <button
            type="button"
            onClick={props.onClearNotes}
            disabled={props.notes.length === 0}
            className="rounded-md px-2 py-1 text-xs text-[#8a3f30] hover:bg-[#f7ebe8] disabled:cursor-not-allowed disabled:opacity-60"
          >
            清空全部
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-4">
        {props.notes.length === 0 ? (
          <div className="flex h-full min-h-[260px] items-center justify-center text-sm text-muted">
            暂无笔记。划选阅读区文本后点击“加入笔记”。
          </div>
        ) : (
          props.notes.map((note, index) => (
            <NoteCard
              key={note.id}
              index={index}
              note={note}
              onChangeUserNote={props.onChangeUserNote}
              onDelete={props.onDeleteNote}
            />
          ))
        )}
      </div>
    </section>
  );
}
