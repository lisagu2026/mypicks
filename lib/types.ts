export type Note = {
  id: string;
  text: string;
  translation: string;
  context: string;
  contextTranslation: string;
  userNote: string;
  createdAt: string;
};

export type TranslationResult = {
  selectedTranslation: string;
  contextTranslation: string;
};

export type ReviewResult = {
  summary: string;
  missingPoints: string[];
  potentialIssues: string[];
  practice: string[];
  perNoteAdditions: string[];
};

export type ActiveSelection = {
  selectedText: string;
  contextSentence: string;
  startIndex: number;
  endIndex: number;
  anchorX: number;
  anchorY: number;
};
