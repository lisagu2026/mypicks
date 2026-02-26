"use client";

import { useCallback, useRef } from "react";
import { extractContextSentence } from "@/lib/text";
import type { ActiveSelection } from "@/lib/types";
import { SelectionPopover } from "@/components/SelectionPopover";
import type { TranslationResult } from "@/lib/types";

type ReaderPaneProps = {
  fullText: string;
  activeSelection: ActiveSelection | null;
  onSelectionChange: (selection: ActiveSelection | null) => void;
  onClosePopover: () => void;
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
};

export function ReaderPane(props: ReaderPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const updateSelection = useCallback(() => {
    const container = containerRef.current;
    if (!container || !props.fullText) {
      props.onSelectionChange(null);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      props.onSelectionChange(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const commonNode = range.commonAncestorContainer;
    if (!container.contains(commonNode)) {
      props.onSelectionChange(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      props.onSelectionChange(null);
      return;
    }

    const startRange = range.cloneRange();
    startRange.selectNodeContents(container);
    startRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = startRange.toString().length;
    const endIndex = startIndex + selectedText.length;

    const contextSentence = extractContextSentence({
      fullText: props.fullText,
      startIndex,
      endIndex,
      selectedText
    });

    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const anchorX =
      rect.left - containerRect.left + container.scrollLeft + Math.min(rect.width / 2, 140);
    const anchorY = rect.bottom - containerRect.top + container.scrollTop + 8;

    props.onSelectionChange({
      selectedText,
      contextSentence,
      startIndex,
      endIndex,
      anchorX,
      anchorY
    });
  }, [props]);

  return (
    <section className="flex min-h-0 flex-col rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-medium">阅读区</h2>
      </div>
      <div
        ref={containerRef}
        onMouseUp={updateSelection}
        onKeyUp={updateSelection}
        onMouseDown={(e) => {
          if (e.target === containerRef.current) {
            props.onClosePopover();
          }
        }}
        className="relative min-h-0 flex-1 overflow-auto px-4 py-4"
      >
        {props.fullText ? (
          <pre className="whitespace-pre-wrap break-words font-sans text-[15px] leading-7 text-ink">
            {props.fullText}
          </pre>
        ) : (
          <div className="flex h-full min-h-[260px] items-center justify-center text-sm text-muted">
            在上方粘贴全文并点击“开始学习”
          </div>
        )}

        {props.activeSelection ? (
          <SelectionPopover
            x={Math.max(8, props.activeSelection.anchorX - 150)}
            y={props.activeSelection.anchorY}
            selectedText={props.activeSelection.selectedText}
            contextSentence={props.activeSelection.contextSentence}
            aiDisabledReason={props.aiDisabledReason}
            translationResult={props.translationResult}
            isTranslating={props.isTranslating}
            onTranslate={props.onTranslate}
            onAddNote={props.onAddNote}
            isAddingNote={props.isAddingNote}
            isAskExpanded={props.isAskExpanded}
            onToggleAsk={props.onToggleAsk}
            question={props.question}
            onQuestionChange={props.onQuestionChange}
            onSubmitAsk={props.onSubmitAsk}
            isAsking={props.isAsking}
            askAnswer={props.askAnswer}
            onCopyAnswerToNote={props.onCopyAnswerToNote}
            canCopyAnswer={props.canCopyAnswer}
            onClose={props.onClosePopover}
          />
        ) : null}
      </div>
    </section>
  );
}
