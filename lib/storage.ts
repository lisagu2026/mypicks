import type { Note } from "@/lib/types";

const DOC_KEY = "mypicks:docText";
const NOTES_KEY = "mypicks:notes";
const SCHEMA_KEY = "mypicks:schemaVersion";
const SCHEMA_VERSION = 1;
const LEGACY_DOC_KEY = "vibereader:docText";
const LEGACY_NOTES_KEY = "vibereader:notes";
const LEGACY_SCHEMA_KEY = "vibereader:schemaVersion";

export function getStorageKeys() {
  return {
    docKey: DOC_KEY,
    notesKey: NOTES_KEY,
    schemaKey: SCHEMA_KEY,
    schemaVersion: SCHEMA_VERSION
  };
}

export function loadPersistedState(): { docText: string; notes: Note[] } {
  if (typeof window === "undefined") {
    return { docText: "", notes: [] };
  }

  try {
    const schemaRaw = window.localStorage.getItem(SCHEMA_KEY);
    if (schemaRaw !== null && Number(schemaRaw) !== SCHEMA_VERSION) {
      return { docText: "", notes: [] };
    }

    let docText = window.localStorage.getItem(DOC_KEY) ?? "";
    let notesRaw = window.localStorage.getItem(NOTES_KEY);

    if (!docText && !notesRaw) {
      const legacySchemaRaw = window.localStorage.getItem(LEGACY_SCHEMA_KEY);
      if (legacySchemaRaw === null || Number(legacySchemaRaw) === SCHEMA_VERSION) {
        const legacyDocText = window.localStorage.getItem(LEGACY_DOC_KEY) ?? "";
        const legacyNotesRaw = window.localStorage.getItem(LEGACY_NOTES_KEY);
        if (legacyDocText || legacyNotesRaw) {
          docText = legacyDocText;
          notesRaw = legacyNotesRaw;
          persistState(docText, legacyNotesRaw ? (JSON.parse(legacyNotesRaw) as Note[]) : []);
        }
      }
    }

    const notes = notesRaw ? (JSON.parse(notesRaw) as Note[]) : [];

    return {
      docText,
      notes: Array.isArray(notes) ? notes : []
    };
  } catch {
    return { docText: "", notes: [] };
  }
}

export function persistState(docText: string, notes: Note[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SCHEMA_KEY, String(SCHEMA_VERSION));
  window.localStorage.setItem(DOC_KEY, docText);
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
