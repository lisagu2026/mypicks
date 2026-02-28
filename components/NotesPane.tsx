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
    <section className="flex min-h-0 flex-col rounded-[30px] border border-white/80 bg-white/62 p-2 shadow-[0_20px_50px_-38px_rgba(35,57,92,0.26)]">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold tracking-wide text-ink">笔记区</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{props.notes.length} 条</span>
          <button
            type="button"
            onClick={props.onClearNotes}
            disabled={props.notes.length === 0}
            className="rounded-full px-2.5 py-1.5 text-xs text-muted transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-60"
          >
            清空全部
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-auto rounded-[26px] border border-line/60 bg-white px-4 py-4 md:px-5 md:py-5">
        {props.notes.length === 0 ? (
          <div className="flex h-full min-h-[280px] items-center justify-center">
            <div className="px-6 py-8 text-center text-sm text-muted">
              暂无笔记。划选阅读区文本后点击“加入笔记”。
            </div>
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
