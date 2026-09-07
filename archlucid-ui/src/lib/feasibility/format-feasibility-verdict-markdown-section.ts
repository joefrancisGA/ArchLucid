import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { isExportableDecisionVerdict } from "@/lib/decision-receipt-export";
import {
  HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON,
  hasHardInfeasibleCitation,
  resolveHardInfeasibleCitationExportBlockedReason,
} from "@/lib/feasibility/feasibility-verdict-citation";
import { resolveFeasibilityVerdictForDisplay } from "@/lib/feasibility/resolve-feasibility-verdict-for-display";

export {
  HARD_INFEASIBLE_MISSING_CITATION_EXPORT_BLOCKED_REASON,
  resolveHardInfeasibleCitationExportBlockedReason,
};

const SOFT_INFEASIBLE_ENVELOPE_EXPORT_LEAD =
  "This verdict is soft infeasible within the stated operating envelope — treat as a bounded decision record, not a failed review.";

function formatHardCitationLines(verdict: ManifestFeasibilityVerdict): string[] {
  const lines: string[] = [];
  const citations = verdict.hardCitations ?? [];

  if (citations.length > 0) {
    lines.push("### Authority citations");
    lines.push("");

    for (const citation of citations) {
      const reference = (citation.reference ?? "").trim();
      const kind = (citation.kind ?? "").trim();
      const invariantKeys = citation.invariantKeys ?? [];
      const suffix =
        invariantKeys.length > 0 ? ` (${invariantKeys.join(", ")})` : "";

      if (reference.length > 0) {
        lines.push(`- ${reference}${kind.length > 0 ? ` — ${kind}` : ""}${suffix}`);
      }
    }

    lines.push("");
  }

  const unsatCore = verdict.unsatCoreInvariantKeys ?? [];

  if (unsatCore.length > 0) {
    lines.push(`**Unsat core:** ${unsatCore.join(", ")}`);
    lines.push("");
  }

  return lines;
}

function formatSoftEnvelopeLines(verdict: ManifestFeasibilityVerdict): string[] {
  const envelope = verdict.softEnvelope;

  if (envelope === null || envelope === undefined) {
    return [];
  }

  const lines: string[] = [];

  lines.push(SOFT_INFEASIBLE_ENVELOPE_EXPORT_LEAD);
  lines.push("");
  lines.push(`- **Confidence band:** ${envelope.confidenceLow}–${envelope.confidenceHigh}`);
  lines.push(`- **Envelope:** ${envelope.envelopeDescription}`);
  lines.push(`- **Soft assumption:** ${envelope.softAssumption}`);

  if ((envelope.costOfBeingWrong ?? "").trim().length > 0) {
    lines.push(`- **Cost of being wrong:** ${envelope.costOfBeingWrong}`);
  }

  lines.push("");

  return lines;
}

/** Shared markdown section for feasibility verdict honesty on career exports (FC-30 / FC-31). */
export function formatFeasibilityVerdictMarkdownSection(
  verdict: ManifestFeasibilityVerdict | null | undefined,
): string {
  if (verdict === null || verdict === undefined) {
    return "";
  }

  const lines: string[] = [];
  const blockedReason = resolveHardInfeasibleCitationExportBlockedReason(verdict);
  const display = resolveFeasibilityVerdictForDisplay(verdict);

  if (blockedReason !== null) {
    lines.push(`> **Career export blocked:** ${blockedReason}`);
    lines.push("");
  }

  lines.push("## Feasibility verdict");
  lines.push("");
  lines.push(`- **Class:** ${display.kindLabel}`);

  if (isExportableDecisionVerdict(verdict.kind)) {
    lines.push(
      "- **Decision record:** Treat exports as a reasoned decision record, not approval to proceed.",
    );
  }

  lines.push("");
  lines.push(verdict.summary.trim());
  lines.push("");

  if (verdict.kind === "SoftInfeasible") {
    lines.push(...formatSoftEnvelopeLines(verdict));
  }

  if (verdict.kind === "HardInfeasible" && hasHardInfeasibleCitation(verdict)) {
    lines.push(...formatHardCitationLines(verdict));
  } else if (verdict.kind === "HardInfeasible" && display.missingHardCitationDefect) {
    lines.push(
      "_Hard infeasibility cannot be exported without a law, theorem, or invariant contradiction reference._",
    );
    lines.push("");
  }

  return lines.join("\n");
}
