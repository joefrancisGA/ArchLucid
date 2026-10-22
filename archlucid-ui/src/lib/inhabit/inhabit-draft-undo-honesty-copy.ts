/** IH-036 — ADR 0071 in-tab draft undo honesty (not a 300s toast change). */
export const INHABIT_DRAFT_UNDO_IN_TAB_TITLE = "Undo is in this tab only" as const;

export const INHABIT_DRAFT_UNDO_IN_TAB_BODY =
  "Ctrl+Z and Ctrl+Y undo edits in this browser tab. Refresh or close the tab clears the stack. Autosave is the server document — not a cross-session undo kernel." as const;

export const ARCHITECTURE_DRAFT_EDITING_HELP_UNDO_TITLE = INHABIT_DRAFT_UNDO_IN_TAB_TITLE;

export const ARCHITECTURE_DRAFT_EDITING_HELP_UNDO_COPY = INHABIT_DRAFT_UNDO_IN_TAB_BODY;
