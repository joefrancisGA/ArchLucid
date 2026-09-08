import {
  EVIDENCE_TRACE_PAGE_SUBTITLE,
} from "@/lib/findings/finding-evidence-navigation";

export const EVIDENCE_TRACE_PRIMARY_CONTENT_ID = "evidence-trace-primary-content" as const;

export const EVIDENCE_TRACE_FIRST_VIEWPORT_ID = "evidence-trace-first-viewport" as const;

export const EVIDENCE_TRACE_FIRST_VIEWPORT_TEST_ID = EVIDENCE_TRACE_FIRST_VIEWPORT_ID;

export const EVIDENCE_TRACE_SKIP_TARGET_ID = EVIDENCE_TRACE_FIRST_VIEWPORT_ID;

export const EVIDENCE_TRACE_SKIP_LINK_LABEL = "Skip to evidence trace" as const;

export const EVIDENCE_TRACE_CLAIM_HEADING = "Single-finding trace only";

export const EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER =
  "Policy, evidence, reasoning, and audit linkage for this finding — open finding detail or review provenance for the full package.";

export function evidenceTracePageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER : EVIDENCE_TRACE_PAGE_SUBTITLE;
}
