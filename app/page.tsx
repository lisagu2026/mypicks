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
  const [answeredQuestion, setAnsweredQuestion] = useState<string | null>(null);
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
    setAnsweredQuestion(null);
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
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "翻译失败，请稍后重试。";
      setMessage(messageText);
      return null;
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
        setAnsweredQuestion(questionSnapshot);
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "问 AI 失败，请稍后重试。";
      setMessage(messageText);
    } finally {
      if (selectionTokenRef.current === token) {
        setIsAsking(false);
      }
    }
  }

  function handleCopyAnswerToNote(): void {
    if (!askAnswer || !answeredQuestion) {
      return;
    }

    const note = createNote({
      text: `Q: ${answeredQuestion}\nA: ${askAnswer}`,
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
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "AI 复盘失败，请稍后重试。";
      setMessage(messageText);
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
    <main className="relative mx-auto h-screen max-w-[1600px] px-4 py-4 md:px-6 md:py-5">
      <div className="flex h-full flex-col gap-4 xl:hidden">
        <section className="rounded-[28px] border border-white/80 bg-white/82 p-3 shadow-[0_20px_50px_-34px_rgba(35,57,92,0.28)]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTopInputExpanded((prev) => !prev)}
              className="rounded-full bg-white px-4 py-2 text-sm text-ink transition hover:bg-paper"
            >
              {isTopInputExpanded ? "收起文稿" : "展开文稿"}
            </button>
            <button
              type="button"
              onClick={handleStartLearning}
              className="rounded-full bg-accent px-4 py-2 text-sm text-white transition hover:bg-[#315f98]"
            >
              开始学习
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={notes.length === 0}
              className="rounded-full bg-white px-4 py-2 text-sm transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
            >
              导出
            </button>
            <button
              type="button"
              onClick={handleReviewAI}
              disabled={!docText || limitStatus.exceeded || isReviewing}
              title={limitStatus.reason ?? undefined}
              className="rounded-full bg-white px-4 py-2 text-sm transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReviewing ? "复盘中..." : "复盘"}
            </button>
          </div>
          {isTopInputExpanded ? (
            <div className="mt-3 rounded-[24px] border border-line/70 bg-[#fbfdff] p-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted/80">Reading Studio</p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">MyPicks</h1>
                </div>
                <div className="text-right text-[11px] leading-5 text-muted">
                  <p>{docText.length} chars</p>
                  <p>{countWords(docText)} words</p>
                </div>
              </div>
              <textarea
                value={docDraft}
                onChange={(e) => setDocDraft(e.target.value)}
                rows={7}
                placeholder="粘贴全文（重新开始学习会覆盖当前全文并清空笔记）"
                className="w-full rounded-3xl bg-white p-4 text-[14px] leading-6 outline-none transition placeholder:text-muted/70 focus:ring-4 focus:ring-[#3a72b7]/10"
              />
            </div>
          ) : null}
          {message ? <p className="mt-3 rounded-2xl bg-[#edf4ff] px-3 py-2 text-sm text-[#3d5e89]">{message}</p> : null}
          {limitStatus.reason ? (
            <p className="mt-2 rounded-2xl bg-[#f6f8fc] px-3 py-2 text-xs text-muted">{limitStatus.reason}</p>
          ) : null}
        </section>
      </div>

      <div className="hidden xl:block">
        <div className="absolute left-6 top-5 z-20 flex w-[84px] flex-col items-center gap-3 rounded-[28px] border border-white/85 bg-white/88 px-2.5 py-3 shadow-[0_20px_60px_-36px_rgba(35,57,92,0.32)] backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f3f7fd] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#56719a]">
            MP
          </div>
          <button
            type="button"
            onClick={() => setIsTopInputExpanded((prev) => !prev)}
            className="flex w-full flex-col items-center rounded-2xl px-2 py-2 text-[11px] text-muted transition hover:bg-[#f4f8fd]"
          >
            <span className="text-base leading-none text-ink">+</span>
            <span className="mt-1">{isTopInputExpanded ? "收起" : "文稿"}</span>
          </button>
          <button
            type="button"
            onClick={handleStartLearning}
            className="flex w-full flex-col items-center rounded-2xl bg-accent px-2 py-2 text-[11px] text-white transition hover:bg-[#315f98]"
          >
            <span className="text-base leading-none">▶</span>
            <span className="mt-1">开始</span>
          </button>
          <button
            type="button"
            onClick={handleExportMarkdown}
            disabled={notes.length === 0}
            className="flex w-full flex-col items-center rounded-2xl px-2 py-2 text-[11px] text-muted transition hover:bg-[#f4f8fd] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-base leading-none text-ink">↓</span>
            <span className="mt-1">导出</span>
          </button>
          <button
            type="button"
            onClick={handleReviewAI}
            disabled={!docText || limitStatus.exceeded || isReviewing}
            title={limitStatus.reason ?? undefined}
            className="flex w-full flex-col items-center rounded-2xl px-2 py-2 text-[11px] text-muted transition hover:bg-[#f4f8fd] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="text-base leading-none text-ink">AI</span>
            <span className="mt-1">{isReviewing ? "进行中" : "复盘"}</span>
          </button>
        </div>

        <div
          className={`absolute left-[118px] top-5 z-10 w-[336px] transition duration-300 ${
            isTopInputExpanded ? "pointer-events-auto opacity-100 translate-x-0" : "pointer-events-none opacity-0 -translate-x-3"
          }`}
        >
          <section className="max-h-[calc(100vh-40px)] overflow-auto rounded-[30px] border border-white/85 bg-white p-4 shadow-[0_24px_70px_-36px_rgba(35,57,92,0.34)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted/80">Reading Studio</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">MyPicks</h1>
              </div>
              <div className="text-right text-[11px] leading-5 text-muted">
                <p>{docText.length} chars</p>
                <p>{countWords(docText)} words</p>
              </div>
            </div>

            <textarea
              value={docDraft}
              onChange={(e) => setDocDraft(e.target.value)}
              rows={10}
              placeholder="粘贴全文（重新开始学习会覆盖当前全文并清空笔记）"
              className="mt-4 w-full rounded-[26px] border border-line/70 bg-[#fbfdff] p-4 text-[14px] leading-6 outline-none transition placeholder:text-muted/70 focus:ring-4 focus:ring-[#3a72b7]/10"
            />

            {message ? (
              <p className="mt-3 rounded-2xl bg-[#edf4ff] px-3 py-2 text-sm text-[#3d5e89]">{message}</p>
            ) : null}
            {limitStatus.reason ? (
              <p className="mt-2 rounded-2xl bg-[#f6f8fc] px-3 py-2 text-xs text-muted">{limitStatus.reason}</p>
            ) : null}

            {reviewResult ? (
              <div className="mt-4 rounded-[24px] bg-[#f8fbff] p-4 text-sm">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">AI 复盘结果</p>
                <p className="mt-2 whitespace-pre-wrap leading-6">{reviewResult.summary}</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs text-muted">遗漏点</p>
                    <ul className="mt-1 list-disc pl-5">
                      {reviewResult.missingPoints.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted">潜在问题</p>
                    <ul className="mt-1 list-disc pl-5">
                      {reviewResult.potentialIssues.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted">练习建议</p>
                    <ul className="mt-1 list-disc pl-5">
                      {reviewResult.practice.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted">按笔记补充</p>
                    <ul className="mt-1 list-disc pl-5">
                      {reviewResult.perNoteAdditions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <section className="h-full min-h-0 xl:pl-[430px]">
        <div className="grid h-full min-h-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)] lg:gap-8">
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
        </div>
      </section>
    </main>
  );
}
