/** Working-document field for BA follow-ups — not a sealed record (WS-19). */
export const ARCHITECTURE_OPEN_QUESTIONS_LABEL = "Open questions" as const;

export const ARCHITECTURE_OPEN_QUESTIONS_HELPER =
  "Track follow-ups for business analysts and stakeholders. Saved with this draft only — not part of a sealed review unless you later record them through the review trail." as const;

export const ARCHITECTURE_OPEN_QUESTIONS_PLACEHOLDER =
  "Example: Who approves cross-region failover? What is the RTO target for payment processing?" as const;

export const ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_LABEL = ARCHITECTURE_OPEN_QUESTIONS_LABEL;

export const ARCHITECTURE_IDENTITY_DESK_OPEN_QUESTIONS_EMPTY =
  "No open questions recorded on the current draft." as const;
