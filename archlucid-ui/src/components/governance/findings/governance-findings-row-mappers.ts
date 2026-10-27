import { formatFindingHumanReviewStatusLabel } from "@/lib/findings/finding-human-review-display";
import { coerceComplianceRuleKey } from "@/lib/policy/policy-pack-rule-key-prefix-catalog";
import { normalizeFindingSemanticSupportBand } from "@/lib/findings/semantic-support-band-presentation";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID } from "@/lib/showcase-static-demo";
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
import { ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED } from "@/lib/architecture/architecture-risk-register-csv";
import {
  GOVERNANCE_QUEUE_DECISION_CATEGORY_NOT_STORED,
  GOVERNANCE_QUEUE_DECISION_RATIONALE_NOT_STORED,
  GOVERNANCE_QUEUE_DECISION_STATUS_NOT_STORED,
  GOVERNANCE_QUEUE_DECISION_TITLE_NOT_STORED,
  GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED,
  GOVERNANCE_QUEUE_FINDING_TITLE_NOT_STORED,
  GOVERNANCE_QUEUE_CATEGORY_NOT_STORED,
  GOVERNANCE_QUEUE_CATEGORY_STORED_EMPTY,
  GOVERNANCE_QUEUE_RECOMMENDED_ACTION_NOT_STORED,
  GOVERNANCE_QUEUE_REVIEW_NAME_NOT_STORED,
  GOVERNANCE_QUEUE_REVIEW_TITLE_NOT_STORED,
  GOVERNANCE_QUEUE_RULE_ID_NOT_STORED,
  GOVERNANCE_QUEUE_SEVERITY_NOT_STORED,
  GOVERNANCE_QUEUE_RATIONALE_NOT_STORED,
} from "@/components/governance/findings/governance-findings-row-omission-copy";

function resolveGovernanceQueueReviewLabel(systemName: string, runId: string): string {
  if (systemName.length > 0) {
    return systemName;
  }

  if (runId.length > 0) {
    return GOVERNANCE_QUEUE_REVIEW_TITLE_NOT_STORED;
  }

  return GOVERNANCE_QUEUE_REVIEW_NAME_NOT_STORED;
}

function resolveRiskRegisterQueueStatus(statusLabel: string, isStale: boolean): string {
  const trimmed = statusLabel.trim();

  if (trimmed.length === 0) {
    return isStale ? `${GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED} · stale` : GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED;
  }

  return isStale ? `${trimmed} · stale` : trimmed;
}

function formatRiskRegisterQueueOwner(ownerUserId: string | null | undefined): string {
  const trimmed = ownerUserId?.trim() ?? "";

  if (trimmed.length === 0) {
    return ARCHITECTURE_RISK_REGISTER_OWNER_NOT_STORED;
  }

  return trimmed;
}

export function riskRegisterRows(entries: ArchitectureRiskRegisterEntry[]): GovernanceFindingQueueRow[] {
  // OpenAPI marks findingId optional; malformed register rows must not become selectable queue items.
  return entries.filter((entry) => entry.findingId?.trim().length > 0).map((entry) => {
    const findingId = entry.findingId.trim();
    const runId = (entry.runId ?? "").trim();
    const systemName = (entry.systemName ?? "").trim();
    const resourceId = (entry.resourceId ?? "").trim();
    const title = (entry.title ?? "").trim();
    const severity = (entry.severity ?? "").trim();
    const categoryRaw = entry.category ?? "";
    const category = categoryRaw.trim();
    const statusLabel = (entry.statusLabel ?? "").trim();
    const recommended =
      entry.latestDisposition !== null && entry.latestDisposition !== undefined
        ? `Latest disposition: ${entry.latestDisposition}. Owner: ${formatRiskRegisterQueueOwner(entry.ownerUserId)}.`
        : GOVERNANCE_QUEUE_RECOMMENDED_ACTION_NOT_STORED;
    const runLabel = resolveGovernanceQueueReviewLabel(systemName, runId);
    const resolvedTitle = title.length > 0 ? title : GOVERNANCE_QUEUE_FINDING_TITLE_NOT_STORED;
    const resolvedSeverity = severity.length > 0 ? severity : GOVERNANCE_QUEUE_SEVERITY_NOT_STORED;
    const resolvedCategory =
      category.length > 0
        ? category
        : categoryRaw.length > 0
          ? GOVERNANCE_QUEUE_CATEGORY_STORED_EMPTY
          : GOVERNANCE_QUEUE_CATEGORY_NOT_STORED;

    return {
      runId,
      runLabel,
      manifestId: (entry.manifestId ?? "").trim(),
      findingId,
      title: resolvedTitle,
      severity: resolvedSeverity,
      category: resolvedCategory,
      status: resolveRiskRegisterQueueStatus(statusLabel, entry.isStale),
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
      evidenceRefCount: null,
      humanReviewStatusLabel: formatFindingHumanReviewStatusLabel(entry.humanReviewStatus),
      itsmLinkedTicketsSummary:
        (entry.itsmLinkedTicketsSummary ?? "").trim().length > 0
          ? (entry.itsmLinkedTicketsSummary ?? "").trim()
          : null,
      systemName: systemName.length > 0 ? systemName : null,
      resourceId: resourceId.length > 0 ? resourceId : null,
      policyRuleId: null,
    };
  });
}

export function decisionRegisterRows(entries: ArchitectureDecisionRegisterEntry[]): GovernanceFindingQueueRow[] {
  return entries.filter((entry) => entry.decisionId?.trim().length > 0).map((entry) => {
    const decisionId = entry.decisionId.trim();
    const runId = (entry.runId ?? "").trim();
    const manifestId = (entry.manifestId ?? "").trim();
    const titleRaw = (entry.title ?? "").trim();
    const categoryRaw = (entry.category ?? "").trim();
    const rationale = (entry.rationale ?? "").trim();
    const selectedOption = (entry.selectedOption ?? "").trim();
    const recommended =
      rationale.length > 0
        ? rationale
        : GOVERNANCE_QUEUE_DECISION_RATIONALE_NOT_STORED;

    return {
      runId,
      runLabel: resolveGovernanceQueueReviewLabel("", runId),
      manifestId,
      findingId: decisionId,
      title: titleRaw.length > 0 ? titleRaw : GOVERNANCE_QUEUE_DECISION_TITLE_NOT_STORED,
      severity: GOVERNANCE_QUEUE_SEVERITY_NOT_STORED,
      category:
        categoryRaw.length > 0
          ? categoryRaw
          : entry.category === ""
            ? GOVERNANCE_QUEUE_CATEGORY_STORED_EMPTY
            : GOVERNANCE_QUEUE_DECISION_CATEGORY_NOT_STORED,
      status: GOVERNANCE_QUEUE_DECISION_STATUS_NOT_STORED,
      recommended,
      recordKind: "decision",
      traceConfidenceLevel: null,
      lastReviewedUtc: entry.recordedAtUtc ?? null,
      evidenceHref: manifestId.length > 0 ? signedRecordDetailPath(manifestId) : undefined,
    };
  });
}

export function traceRowsForRun(run: RunSummary, traces: FindingTraceConfidenceDto[]): GovernanceFindingQueueRow[] {
  const runId = run.runId.trim();

  return traces
    .filter((t) => (t.findingId ?? "").trim().length > 0)
    .map((t) => {
      const findingId = t.findingId.trim();
      const titleRaw = (t.findingTitle ?? "").trim();
      const manifestRaw =
        typeof (t as { manifestId?: string | null }).manifestId === "string"
          ? (t as { manifestId?: string | null }).manifestId!.trim()
          : "";
      const ruleHint = (t.ruleId ?? "").trim();
      const runDescription = (run.description ?? "").trim();
      const runLabel =
        runDescription.length > 0 ? runDescription : GOVERNANCE_QUEUE_REVIEW_TITLE_NOT_STORED;

      return {
        runId,
        runLabel,
        manifestId: manifestRaw,
        findingId,
        title: titleRaw.length > 0 ? titleRaw : GOVERNANCE_QUEUE_FINDING_TITLE_NOT_STORED,
        severity: GOVERNANCE_QUEUE_SEVERITY_NOT_STORED,
        category: GOVERNANCE_QUEUE_CATEGORY_NOT_STORED,
        status: GOVERNANCE_QUEUE_FINDING_STATUS_NOT_STORED,
        recommended:
          ruleHint.length > 0
            ? `Review finding tied to rule ${ruleHint}.`
            : GOVERNANCE_QUEUE_RECOMMENDED_ACTION_NOT_STORED,
        recordKind: "finding",
        traceConfidenceLevel: normalizeFindingConfidenceLevel(t.confidenceLevel),
        evidenceRefCount:
          typeof t.evidenceRefCount === "number" && Number.isFinite(t.evidenceRefCount)
            ? Math.trunc(t.evidenceRefCount)
            : null,
        policyRuleId: coerceComplianceRuleKey(ruleHint),
        classification: t.classification ?? null,
        treatment:
          typeof t.treatment === "number" && Number.isFinite(t.treatment) ? Math.trunc(t.treatment) : null,
        semanticSupportBand: normalizeFindingSemanticSupportBand(t.semanticSupportBand),
      };
    });
}

export function dedupeGovernanceFindingRows(rows: GovernanceFindingQueueRow[]): GovernanceFindingQueueRow[] {
  const seen = new Set<string>();
  const out: GovernanceFindingQueueRow[] = [];

  for (const row of rows) {
    const key = `${row.runId.trim()}:${row.findingId.trim()}`;

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
