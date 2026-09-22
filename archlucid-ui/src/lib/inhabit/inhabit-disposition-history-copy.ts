/** IH-034 — disposition trail on inspect/panel; empty history is honest. */
export const INHABIT_DISPOSITION_HISTORY_SECTION_TITLE = "Disposition history" as const;

export const INHABIT_DISPOSITION_HISTORY_EMPTY_BODY =
  "No disposition events yet on this finding. Undo toasts expire after five minutes — history here stays on the document." as const;

export const INHABIT_DISPOSITION_HISTORY_LOADING = "Loading disposition history…" as const;

export const INHABIT_DISPOSITION_HISTORY_BLOCKED_FALLBACK =
  "Disposition history could not be loaded. Refresh or open the full evidence trace." as const;
