"use client";

import type React from "react";
import type { TranslationResult } from "@/lib/types";

type SelectionPopoverProps = {
  x: number;
  y: number;
  selectedText: string;
  contextSentence: string;
  aiDisabledReason: string | null;
  translationResult: TranslationResult | null;
  isTranslating: boolean;
  onTranslate: () => void;
  onAddNote: () => void;
  isAddingNote: boolean;
  isAskExpanded: boolean;
  onToggleAsk: () => void;
  question: string;
  onQuestionChange: (value: string) => void;
  onSubmitAsk: () => void;
  isAsking: boolean;
  askAnswer: string | null;
  onCopyAnswerToNote: () => void;
  canCopyAnswer: boolean;
  onClose: () => void;
};

function keepSelection(e: React.MouseEvent) {
  const target = e.target;
  if (
    target instanceof Element &&
    target.closest('textarea,input,button,select,option,label,[contenteditable="true"]')
  ) {
    return;
  }

  e.preventDefault();
}

export function SelectionPopover(props: SelectionPopoverProps) {
  return (
    <div
      data-selection-popover="true"
      className="absolute z-20 w-[368px] max-w-[calc(100%-16px)] rounded-3xl border border-line/70 bg-white p-3.5 shadow-[0_28px_60px_-26px_rgba(35,57,92,0.32)]"
      style={{ left: props.x, top: props.y }}
      onMouseDown={keepSelection}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted">已选文本</p>
          <p className="mt-1 line-clamp-2 rounded-2xl bg-paper/70 px-2.5 py-1.5 text-sm text-ink">
            {props.selectedText}
          </p>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          className="rounded-full px-2.5 py-1 text-xs text-muted transition hover:bg-paper"
        >
          关闭
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={props.onAddNote}
          disabled={props.isAddingNote}
          className="rounded-full bg-accent px-3.5 py-1.5 text-sm text-white transition hover:-translate-y-0.5 hover:bg-[#315f98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {props.isAddingNote ? "加入中..." : "加入笔记"}
        </button>
        <button
          type="button"
          onClick={props.onTranslate}
          disabled={props.isTranslating}
          className="rounded-full bg-paper px-3.5 py-1.5 text-sm transition hover:-translate-y-0.5 hover:bg-[#e9f0f9] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {props.isTranslating ? "翻译中..." : "翻译"}
        </button>
        <button
          type="button"
          onClick={props.onToggleAsk}
          disabled={Boolean(props.aiDisabledReason)}
          className="rounded-full bg-paper px-3.5 py-1.5 text-sm transition hover:-translate-y-0.5 hover:bg-[#e9f0f9] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          title={props.aiDisabledReason ?? undefined}
        >
          问 AI
        </button>
      </div>

      {props.aiDisabledReason ? (
        <p className="mt-2 text-xs text-[#9a5d3f]">{props.aiDisabledReason}</p>
      ) : null}

      {props.translationResult ? (
        <div className="mt-3 space-y-2 rounded-2xl bg-[#f5f8fd] p-3 text-sm">
          <div>
            <p className="text-xs text-muted">选区翻译</p>
            <p className="mt-1 rounded-xl bg-white/78 px-2.5 py-1.5 leading-6">
              {props.translationResult.selectedTranslation}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">语境翻译</p>
            <p className="mt-1 whitespace-pre-wrap rounded-xl bg-white/78 px-2.5 py-1.5 leading-6">
              {props.translationResult.contextTranslation}
            </p>
          </div>
        </div>
      ) : null}

      {props.isAskExpanded ? (
        <div className="mt-3 space-y-2.5 rounded-2xl bg-[#f5f8fd] p-3">
          <p className="text-xs text-muted">语境句（发送给 AI）</p>
          <p className="max-h-20 overflow-auto whitespace-pre-wrap rounded-xl bg-white/80 px-2.5 py-1.5 text-sm leading-6">
            {props.contextSentence}
          </p>
          <textarea
            value={props.question}
            onChange={(e) => props.onQuestionChange(e.target.value)}
            placeholder="输入你的问题..."
            rows={3}
            className="w-full rounded-2xl bg-white p-2.5 text-sm outline-none transition focus:ring-4 focus:ring-[#3a72b7]/10"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={props.onSubmitAsk}
              disabled={props.isAsking || !props.question.trim()}
              className="rounded-full bg-white px-3.5 py-1.5 text-sm transition hover:-translate-y-0.5 hover:bg-[#eef4fb] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {props.isAsking ? "回答中..." : "发送问题"}
            </button>
            {props.askAnswer ? (
              <button
                type="button"
                onClick={props.onCopyAnswerToNote}
                disabled={!props.canCopyAnswer}
                className="rounded-full bg-white px-3.5 py-1.5 text-sm transition hover:-translate-y-0.5 hover:bg-[#eef4fb] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                复制到笔记
              </button>
            ) : null}
          </div>
          {props.askAnswer ? (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-2.5 text-sm leading-6">
              {props.askAnswer}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
