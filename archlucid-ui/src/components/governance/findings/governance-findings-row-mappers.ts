import { formatFindingHumanReviewStatusLabel } from "@/lib/findings/finding-human-review-display";
import { coerceComplianceRuleKey } from "@/lib/policy/policy-pack-rule-key-prefix-catalog";
import { severityFromTrace } from "@/lib/sponsor/sponsor-finding-severity";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator/operator-static-demo";
import {
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
} from "@/lib/showcase-static-demo";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import type {
  ArchitectureDecisionRegisterEntry,
  ArchitectureRiskRegisterEntry,
} from "@/lib/api/governance-stickiness-api";
import type { FindingTraceConfidenceDto } from "@/types/explanation";
import { normalizeFindingConfidenceLevel } from "@/types/explanation";
import type { RunSummary } from "@/types/authority";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { governanceFindingsDemoPhiRow } from "@/components/governance/findings/governance-findings-demo-rows";

export function riskRegisterRows(entries: ArchitectureRiskRegisterEntry[]): GovernanceFindingQueueRow[] {
  return entries.map((entry) => {
    const runId = (entry.runId ?? "").trim();
    const systemName = (entry.systemName ?? "").trim();
    const resourceId = (entry.resourceId ?? "").trim();
    const recommended =
      entry.latestDisposition !== null && entry.latestDisposition !== undefined
        ? `Latest disposition: ${entry.latestDisposition}. Owner: ${entry.ownerUserId ?? "unassigned"}.`
        : "Open evidence trace to record disposition or a time-bounded waiver.";
    const runLabel =
      systemName.length > 0 ? systemName : runId.length > 0 ? runId : " — ";

    return {
      runId: runId.length > 0 ? runId : " — ",
      runLabel,
      manifestId: (entry.manifestId ?? "").trim().length > 0 ? (entry.manifestId ?? "").trim() : " — ",
      findingId: entry.findingId,
      title: entry.title,
      severity: entry.severity,
      category: entry.category,
      status: entry.isStale ? `${entry.statusLabel} · stale` : entry.statusLabel,
      recommended,
      recordKind: "finding",
      traceConfidenceLevel: null,
      ownerUserId: entry.ownerUserId ?? null,
      latestDisposition: entry.latestDisposition ?? null,
      agingDays: entry.agingDays,
      waiverExpiresAtUtc: entry.waiverExpiresAtUtc ?? null,
      lastReviewedUtc: entry.lastReviewedUtc ?? null,
      revisitDueUtc: entry.revisitDueUtc ?? null,
      isStale: entry.isStale,
      evidenceHref: entry.evidenceHref,
      evidenceRefCount: (entry.evidenceHref ?? "").trim().length > 0 ? 1 : null,
      humanReviewStatusLabel: formatFindingHumanReviewStatusLabel(entry.humanReviewStatus),
      itsmLinkedTicketsSummary:
        (entry.itsmLinkedTicketsSummary ?? "").trim().length > 0
          ? (entry.itsmLinkedTicketsSummary ?? "").trim()
          : null,
      systemName: systemName.length > 0 ? systemName : null,
      resourceId: resourceId.length > 0 ? resourceId : null,
      policyRuleId: coerceComplianceRuleKey(entry.category),
    };
  });
}

export function decisionRegisterRows(entries: ArchitectureDecisionRegisterEntry[]): GovernanceFindingQueueRow[] {
  return entries.map((entry) => {
    const runId = (entry.runId ?? "").trim();
    const manifestId = (entry.manifestId ?? "").trim();
    const titleRaw = (entry.title ?? entry.selectedOption ?? entry.decisionId).trim();
    const rationale = (entry.rationale ?? "").trim();
    const selectedOption = (entry.selectedOption ?? "").trim();
    const recommended =
      rationale.length > 0
        ? rationale
        : selectedOption.length > 0
          ? `Selected: ${selectedOption}`
          : "Open the finalized review record for decision context and supporting findings.";

    return {
      runId: runId.length > 0 ? runId : " — ",
      runLabel: runId.length > 0 ? runId : " — ",
      manifestId: manifestId.length > 0 ? manifestId : " — ",
      findingId: entry.decisionId,
      title: titleRaw.length > 0 ? titleRaw : entry.decisionId,
      severity: "Info",
      category: (entry.category ?? "").trim().length > 0 ? entry.category : "Architecture decision",
      status: "Recorded",
      recommended,
      recordKind: "decision",
      traceConfidenceLevel: null,
      lastReviewedUtc: entry.recordedAtUtc ?? null,
      evidenceHref: manifestId.length > 0 ? signedRecordDetailPath(manifestId) : undefined,
    };
  });
}

export function traceRowsForRun(run: RunSummary, traces: FindingTraceConfidenceDto[]): GovernanceFindingQueueRow[] {
  return traces
    .filter((t) => (t.findingId ?? "").trim().length > 0)
    .map((t) => {
      const findingId = t.findingId.trim();
      const titleRaw = (t.findingTitle ?? findingId).trim();
      const manifestRaw = isDemoRunIdEligibleForStaticFallback(run.runId)
        ? SHOWCASE_STATIC_DEMO_MANIFEST_ID
        : " — ";

      const ruleHint = (t.ruleId ?? "").trim();
      const runDescription = (run.description ?? "").trim();
      const runLabel = runDescription.length > 0 ? runDescription : run.runId;

      return {
        runId: run.runId,
        runLabel,
        manifestId: manifestRaw.length > 0 ? manifestRaw : " — ",
        findingId,
        title: titleRaw.length > 0 ? titleRaw : findingId,
        severity: severityFromTrace(t.traceConfidenceLabel),
        category: (t.ruleId ?? " — ").replace(/;/g, ", "),
        status: "Open",
        recommended:
          ruleHint.length > 0
            ? `Review finding tied to rule ${ruleHint}.`
            : "Open the finding to review rationale, evidence, and recommended next steps.",
        recordKind: "finding",
        traceConfidenceLevel: normalizeFindingConfidenceLevel(t.confidenceLevel),
        evidenceRefCount:
          typeof t.evidenceRefCount === "number" && Number.isFinite(t.evidenceRefCount)
            ? Math.trunc(t.evidenceRefCount)
            : null,
        policyRuleId: coerceComplianceRuleKey(ruleHint),
      };
    });
}

export function dedupeGovernanceFindingRows(rows: GovernanceFindingQueueRow[]): GovernanceFindingQueueRow[] {
  const seen = new Set<string>();
  const out: GovernanceFindingQueueRow[] = [];

  for (const row of rows) {
    const key = `${row.runId}:${row.findingId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    out.push(row);
  }

  return out;
}

export function mergeShowcasePhiWhenMissing(rows: GovernanceFindingQueueRow[]): GovernanceFindingQueueRow[] {
  const hasPhi = rows.some((row) => row.findingId === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID);

  if (hasPhi) {
    return rows;
  }

  return [governanceFindingsDemoPhiRow(), ...rows];
}
