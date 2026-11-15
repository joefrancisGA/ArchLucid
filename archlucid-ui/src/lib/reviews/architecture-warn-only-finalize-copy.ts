import { LIVELIHOOD_GRADE_NO_SEMANTIC_NOT_COMMIT_GATE_LINE } from "@/lib/livelihood-grade-no-semantic-not-commit-gate";

/** Workspace AI quality defaults — warn-only vs block finalize (ADR 0085). */
export const ARCH_WORKSPACE_WARN_ONLY_FINALIZE_SHORT =
  "Warn-only: low faithfulness scores show as advisories; structural provenance still gates commit." as const;

export const ARCH_WORKSPACE_WARN_ONLY_FINALIZE_DETAIL = LIVELIHOOD_GRADE_NO_SEMANTIC_NOT_COMMIT_GATE_LINE;