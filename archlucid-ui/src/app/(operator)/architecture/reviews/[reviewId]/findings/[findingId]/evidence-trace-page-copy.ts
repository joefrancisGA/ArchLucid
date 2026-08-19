import {
  EVIDENCE_TRACE_PAGE_SUBTITLE,
} from "@/lib/findings/finding-evidence-navigation";

export const EVIDENCE_TRACE_CLAIM_HEADING = "Single-finding trace only";

export const EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER =
  "Policy, evidence, reasoning, and audit linkage for this finding — open finding detail or review provenance for the full package.";

export function evidenceTracePageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? EVIDENCE_TRACE_PAGE_SUBTITLE_BUYER : EVIDENCE_TRACE_PAGE_SUBTITLE;
}
