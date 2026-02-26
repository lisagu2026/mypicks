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
  e.preventDefault();
}

export function SelectionPopover(props: SelectionPopoverProps) {
  return (
    <div
      className="absolute z-20 w-[360px] max-w-[calc(100%-16px)] rounded-xl border border-line bg-white p-3 shadow-lg"
      style={{ left: props.x, top: props.y }}
      onMouseDown={keepSelection}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted">已选文本</p>
          <p className="line-clamp-2 text-sm text-ink">{props.selectedText}</p>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          className="rounded-md px-2 py-1 text-xs text-muted hover:bg-paper"
        >
          关闭
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={props.onAddNote}
          disabled={props.isAddingNote}
          className="rounded-md border border-line bg-paper px-3 py-1.5 text-sm hover:bg-[#ede9df] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {props.isAddingNote ? "加入中..." : "加入笔记"}
        </button>
        <button
          type="button"
          onClick={props.onTranslate}
          disabled={props.isTranslating}
          className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
        >
          {props.isTranslating ? "翻译中..." : "翻译"}
        </button>
        <button
          type="button"
          onClick={props.onToggleAsk}
          disabled={Boolean(props.aiDisabledReason)}
          className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
          title={props.aiDisabledReason ?? undefined}
        >
          问 AI
        </button>
      </div>

      {props.aiDisabledReason ? (
        <p className="mt-2 text-xs text-[#9a5d3f]">{props.aiDisabledReason}</p>
      ) : null}

      {props.translationResult ? (
        <div className="mt-3 space-y-2 rounded-lg border border-line bg-paper p-2 text-sm">
          <div>
            <p className="text-xs text-muted">选区翻译</p>
            <p>{props.translationResult.selectedTranslation}</p>
          </div>
          <div>
            <p className="text-xs text-muted">语境翻译</p>
            <p className="whitespace-pre-wrap">{props.translationResult.contextTranslation}</p>
          </div>
        </div>
      ) : null}

      {props.isAskExpanded ? (
        <div className="mt-3 space-y-2 rounded-lg border border-line bg-paper p-2">
          <p className="text-xs text-muted">语境句（发送给 AI）</p>
          <p className="max-h-16 overflow-auto whitespace-pre-wrap text-sm">{props.contextSentence}</p>
          <textarea
            value={props.question}
            onChange={(e) => props.onQuestionChange(e.target.value)}
            placeholder="输入你的问题..."
            rows={3}
            className="w-full rounded-md border border-line bg-white p-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={props.onSubmitAsk}
              disabled={props.isAsking || !props.question.trim()}
              className="rounded-md border border-line bg-white px-3 py-1.5 text-sm hover:bg-[#f8f6f0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {props.isAsking ? "回答中..." : "发送问题"}
            </button>
            {props.askAnswer ? (
              <button
                type="button"
                onClick={props.onCopyAnswerToNote}
                disabled={!props.canCopyAnswer}
                className="rounded-md border border-line bg-white px-3 py-1.5 text-sm hover:bg-[#f8f6f0] disabled:cursor-not-allowed disabled:opacity-60"
              >
                复制到笔记
              </button>
            ) : null}
          </div>
          {props.askAnswer ? (
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-white p-2 text-sm">
              {props.askAnswer}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
