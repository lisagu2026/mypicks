"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ReaderPane } from "@/components/ReaderPane";
import { NotesPane } from "@/components/NotesPane";
import { askAI, reviewAI, translateSelection } from "@/lib/api";
import { exportMarkdown } from "@/lib/export";
import { countWords } from "@/lib/text";
import { loadPersistedState, persistState } from "@/lib/storage";
import type { ActiveSelection, Note, ReviewResult, TranslationResult } from "@/lib/types";

const MAX_CHARS = 20000;
const MAX_WORDS = 5000;

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createNote(params: {
  text: string;
  translation?: string;
  context?: string;
  contextTranslation?: string;
  userNote?: string;
}): Note {
  return {
    id: createId(),
    text: params.text,
    translation: params.translation ?? "",
    context: params.context ?? "",
    contextTranslation: params.contextTranslation ?? "",
    userNote: params.userNote ?? "",
    createdAt: new Date().toISOString()
  };
}

export default function Page() {
  const [docDraft, setDocDraft] = useState("");
  const [docText, setDocText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeSelection, setActiveSelection] = useState<ActiveSelection | null>(null);
  const [isTopInputExpanded, setIsTopInputExpanded] = useState(true);

  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isAskExpanded, setIsAskExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selectionTokenRef = useRef(0);

  useEffect(() => {
    const persisted = loadPersistedState();
    setDocText(persisted.docText);
    setDocDraft(persisted.docText);
    setNotes(persisted.notes);
  }, []);

  useEffect(() => {
    persistState(docText, notes);
  }, [docText, notes]);

  const limitStatus = useMemo(() => {
    const charCount = docText.length;
    const wordCount = countWords(docText);
    const exceeded = charCount > MAX_CHARS || wordCount > MAX_WORDS;
    if (!exceeded) {
      return {
        exceeded: false,
        reason: null as string | null,
        charCount,
        wordCount
      };
    }

    return {
      exceeded: true,
      reason: `全文过长（${charCount} chars / ${wordCount} words），已禁用“问AI / AI复盘”，请分段学习。`,
      charCount,
      wordCount
    };
  }, [docText]);

  function resetSelectionTransientState(): void {
    setTranslationResult(null);
    setIsTranslating(false);
    setIsAddingNote(false);
    setIsAskExpanded(false);
    setQuestion("");
    setIsAsking(false);
    setAskAnswer(null);
  }

  function handleSelectionChange(next: ActiveSelection | null): void {
    selectionTokenRef.current += 1;
    setActiveSelection(next);
    resetSelectionTransientState();
  }

  function handleClosePopover(): void {
    selectionTokenRef.current += 1;
    setActiveSelection(null);
    resetSelectionTransientState();
  }

  async function ensureTranslationForSelection(): Promise<TranslationResult | null> {
    if (!activeSelection) {
      return null;
    }
    if (translationResult) {
      return translationResult;
    }

    const token = selectionTokenRef.current;
    const snapshot = activeSelection;
    setIsTranslating(true);
    try {
      const result = await translateSelection({
        selectedText: snapshot.selectedText,
        contextSentence: snapshot.contextSentence
      });
      if (selectionTokenRef.current === token) {
        setTranslationResult(result);
      }
      return result;
    } finally {
      if (selectionTokenRef.current === token) {
        setIsTranslating(false);
      }
    }
  }

  async function handleTranslate(): Promise<void> {
    if (!activeSelection) {
      return;
    }
    setMessage(null);
    await ensureTranslationForSelection();
  }

  async function handleAddNote(): Promise<void> {
    if (!activeSelection) {
      return;
    }

    setMessage(null);
    setIsAddingNote(true);
    try {
      const ensured = await ensureTranslationForSelection();
      if (!ensured) {
        return;
      }

      const note = createNote({
        text: activeSelection.selectedText,
        translation: ensured.selectedTranslation,
        context: activeSelection.contextSentence,
        contextTranslation: ensured.contextTranslation,
        userNote: ""
      });
      setNotes((prev) => [...prev, note]);
      setMessage("已加入笔记。");
    } finally {
      setIsAddingNote(false);
    }
  }

  async function handleSubmitAsk(): Promise<void> {
    if (!activeSelection || !question.trim() || limitStatus.exceeded) {
      return;
    }

    const token = selectionTokenRef.current;
    const snapshot = activeSelection;
    const questionSnapshot = question.trim();
    setMessage(null);
    setIsAsking(true);
    try {
      const result = await askAI({
        selectedText: snapshot.selectedText,
        contextSentence: snapshot.contextSentence,
        fullText: docText,
        question: questionSnapshot
      });
      if (selectionTokenRef.current === token) {
        setAskAnswer(result.answer);
      }
    } finally {
      if (selectionTokenRef.current === token) {
        setIsAsking(false);
      }
    }
  }

  function handleCopyAnswerToNote(): void {
    if (!askAnswer || !question.trim()) {
      return;
    }

    const note = createNote({
      text: `Q: ${question.trim()}\nA: ${askAnswer}`,
      translation: "",
      context: "",
      contextTranslation: "",
      userNote: ""
    });
    setNotes((prev) => [...prev, note]);
    setMessage("AI 问答已复制到笔记。");
  }

  function handleStartLearning(): void {
    const nextText = docDraft.trim();
    if (!nextText) {
      setMessage("请先粘贴全文。");
      return;
    }

    setDocText(nextText);
    setNotes([]);
    setReviewResult(null);
    setIsTopInputExpanded(false);
    handleClosePopover();

    const charCount = nextText.length;
    const wordCount = countWords(nextText);
    if (charCount > MAX_CHARS || wordCount > MAX_WORDS) {
      setMessage(
        `已开始学习并覆盖当前文档，但全文过长（${charCount} chars / ${wordCount} words），已禁用“问AI / AI复盘”，请分段学习。`
      );
    } else {
      setMessage("已开始学习，当前文档与笔记已重置。");
    }
  }

  function handleExportMarkdown(): void {
    if (notes.length === 0) {
      setMessage("暂无笔记可导出。");
      return;
    }
    exportMarkdown(notes);
    setMessage("已导出 Markdown。");
  }

  async function handleReviewAI(): Promise<void> {
    if (!docText) {
      setMessage("请先开始学习。");
      return;
    }
    if (limitStatus.exceeded) {
      setMessage(limitStatus.reason);
      return;
    }

    setIsReviewing(true);
    setMessage(null);
    try {
      const result = await reviewAI({ fullText: docText, notes });
      setReviewResult(result);
    } finally {
      setIsReviewing(false);
    }
  }

  function handleChangeUserNote(id: string, value: string): void {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, userNote: value } : note)));
  }

  function handleDeleteNote(id: string): void {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  function handleClearNotes(): void {
    setNotes([]);
    setMessage("已清空全部笔记。");
  }

  return (
    <main className="mx-auto flex h-screen max-w-[1440px] flex-col gap-4 p-4">
      <section className="rounded-2xl border border-line bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">MyPicks</h1>
          <div className="text-xs text-muted">
            当前全文：{docText.length} chars / {countWords(docText)} words
          </div>
        </div>

        {isTopInputExpanded ? (
          <textarea
            value={docDraft}
            onChange={(e) => setDocDraft(e.target.value)}
            rows={5}
            placeholder="粘贴全文（重新开始学习会覆盖当前全文并清空笔记）"
            className="w-full rounded-xl border border-line bg-[#fffefb] p-3 outline-none focus:border-accent"
          />
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTopInputExpanded((prev) => !prev)}
            title={isTopInputExpanded ? "收起顶部全文输入框" : "展开顶部全文输入框以更换全文"}
            className="rounded-md border border-line px-3 py-2 text-sm hover:bg-paper"
          >
            {isTopInputExpanded ? "收起输入框" : "展开输入框"}
          </button>
          <button
            type="button"
            onClick={handleStartLearning}
            className="rounded-md border border-line bg-paper px-3 py-2 text-sm hover:bg-[#ede9df]"
          >
            开始学习
          </button>
          <button
            type="button"
            onClick={handleExportMarkdown}
            disabled={notes.length === 0}
            className="rounded-md border border-line px-3 py-2 text-sm hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
          >
            导出 Markdown
          </button>
          <button
            type="button"
            onClick={handleReviewAI}
            disabled={!docText || limitStatus.exceeded || isReviewing}
            title={limitStatus.reason ?? undefined}
            className="rounded-md border border-line px-3 py-2 text-sm hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isReviewing ? "AI 复盘中..." : "AI 复盘（mock）"}
          </button>
        </div>

        {message ? <p className="mt-3 text-sm text-[#7d5138]">{message}</p> : null}
        {limitStatus.reason ? <p className="mt-2 text-xs text-[#9a5d3f]">{limitStatus.reason}</p> : null}

        {reviewResult ? (
          <div className="mt-3 rounded-xl border border-line bg-paper p-3 text-sm">
            <p className="mb-2 text-xs text-muted">AI 复盘结果（mock）</p>
            <p className="mb-2 whitespace-pre-wrap">{reviewResult.summary}</p>
            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted">遗漏点</p>
                <ul className="list-disc pl-5">
                  {reviewResult.missingPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted">潜在问题</p>
                <ul className="list-disc pl-5">
                  {reviewResult.potentialIssues.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted">练习建议</p>
                <ul className="list-disc pl-5">
                  {reviewResult.practice.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-muted">按笔记补充</p>
                <ul className="list-disc pl-5">
                  {reviewResult.perNoteAdditions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ReaderPane
          fullText={docText}
          activeSelection={activeSelection}
          onSelectionChange={handleSelectionChange}
          onClosePopover={handleClosePopover}
          aiDisabledReason={limitStatus.reason}
          translationResult={translationResult}
          isTranslating={isTranslating}
          onTranslate={handleTranslate}
          onAddNote={handleAddNote}
          isAddingNote={isAddingNote}
          isAskExpanded={isAskExpanded}
          onToggleAsk={() => setIsAskExpanded((prev) => !prev)}
          question={question}
          onQuestionChange={setQuestion}
          onSubmitAsk={handleSubmitAsk}
          isAsking={isAsking}
          askAnswer={askAnswer}
          onCopyAnswerToNote={handleCopyAnswerToNote}
          canCopyAnswer={Boolean(askAnswer)}
        />
        <NotesPane
          notes={notes}
          onChangeUserNote={handleChangeUserNote}
          onDeleteNote={handleDeleteNote}
          onClearNotes={handleClearNotes}
        />
      </section>
    </main>
  );
}
