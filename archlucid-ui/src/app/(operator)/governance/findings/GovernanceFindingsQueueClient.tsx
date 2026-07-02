"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactElement } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { FindingPolicyTraceabilityBadges } from "@/components/FindingPolicyTraceabilityBadges";
import { buildPolicyTraceabilityLinksFromRuleId } from "@/lib/finding-policy-evidence-citations";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { ProductConceptsGlossary } from "@/components/ProductConceptsGlossary";
import { Button } from "@/components/ui/button";
import { GovernanceFindingsQueueDesktopTable } from "./GovernanceFindingsQueueDesktopTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRunExplanationSummary, listRunsByProjectPaged } from "@/lib/api";
import {
  getArchitectureDecisionRegister,
  getArchitectureRiskRegister,
  type ArchitectureDecisionRegisterEntry,
  type ArchitectureRiskRegisterEntry,
} from "@/lib/api/governance-stickiness-api";
import { formatFindingHumanReviewStatusLabel } from "@/lib/finding-human-review-display";
import { coerceComplianceRuleKey } from "@/lib/policy-pack-rule-key-prefix-catalog";
import { CopyGovernanceQueueWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";
import { GovernanceFindingsBulkActions } from "@/components/usability/GovernanceFindingsBulkActions";
import { downloadArchitectureRiskRegisterCsv } from "@/lib/architecture-risk-register-csv";
import {
  ARCHITECTURE_RISK_REGISTER_CONTAINS_COPY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_BODY,
  ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE,
  ARCHITECTURE_RISK_REGISTER_GLOSSARY,
  ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_TITLE,
  ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF,
  computeArchitectureRiskRegisterSummary,
  matchesRiskRegisterFilter,
  RISK_REGISTER_FILTER_LABELS,
  RISK_REGISTER_QUICK_FILTERS,
  riskRegisterFilterFromQuery,
  type RiskRegisterFilter,
} from "@/lib/architecture-risk-register-page";
import { downloadGovernanceFindingsItsmJsonExport } from "@/lib/run-findings-itsm-export";
import {
  readGroupByResourcePreference,
  writeGroupByResourcePreference,
} from "@/lib/governance-findings-group-by-resource-storage";
import { severityFromTrace } from "@/lib/executive-finding-severity";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator-static-demo";
import {
  BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD,
  BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE,
  BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE,
  BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA,
  BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA,
  BUYER_GOVERNANCE_PAGE_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { shouldUseGovernanceCuratedDemoSpine } from "@/lib/buyer-demo-content-gating";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import type { FindingTraceConfidenceDto } from "@/types/explanation";
import { normalizeFindingConfidenceLevel } from "@/types/explanation";
import type { RunSummary } from "@/types/authority";

/** Buyer-polished demo rows: action text aligned to each bundled decision synopsis (indices 0–7). */
const SHOWCASE_GOVERNANCE_DECISION_RECOMMENDED: readonly string[] = [
  "Reconfirm intake stays system-of-record in the next integration review; refresh the adapter inventory.",
  "Spot-check ingress PHI classifications quarterly and tighten tagging rules when drift appears.",
  "Load-test bounded queues and back-pressure thresholds ahead of peak season; document rollback.",
  "Review capped rework-queue metrics monthly; escalate sustained overflow to supervised exception owners.",
  "Verify OCR vendor agreements and human confirm gates before expanding unstructured attachment volume.",
  "Exercise signing-key rotation and consumer idempotency in CI before major adjudication changes.",
  "Align retention attestations with enterprise records management ahead of external audits.",
  "Publish intake latency, queue depth, and exception-rate dashboards in the sponsor KPI pack.",
];

import {
  formatGovernanceQueueRecordKind,
  type GovernanceFindingQueueRow,
} from "./governance-finding-queue-row";

export type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

const FILTER_PRESET_STORAGE_KEY = "archlucid.governance.filterPresets.v1";

type FilterPreset = {
  readonly id: string;
  readonly label: string;
  readonly filter: RiskRegisterFilter;
};

const FILTER_PRESET_LABELS: Record<RiskRegisterFilter, string> = RISK_REGISTER_FILTER_LABELS;

function loadSavedPresets(): FilterPreset[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(FILTER_PRESET_STORAGE_KEY) : null;

    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is FilterPreset =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).id === "string" &&
        typeof (item as Record<string, unknown>).label === "string" &&
        typeof (item as Record<string, unknown>).filter === "string",
    );
  } catch {
    return [];
  }
}

function savePresetsToStorage(presets: FilterPreset[]): void {
  try {
    window.localStorage.setItem(FILTER_PRESET_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // localStorage may be unavailable (e.g. private browsing with storage blocked)
  }
}

function governanceBuyerRecordTypePrimary(row: GovernanceFindingQueueRow): string {
  if (row.recordKind === "finding" && row.findingId === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID) {
    return "Risk finding";
  }

  return formatGovernanceQueueRecordKind(row.recordKind, true);
}

function governanceBuyerRecordTypeSecondary(row: GovernanceFindingQueueRow): string | null {
  if (row.recordKind === "finding" && row.findingId === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID) {
    return "Risk area: PHI minimization · Disposition: Accepted with monitoring";
  }

  return null;
}

function demoPhiRow(): GovernanceFindingQueueRow {
  return {
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    runLabel: "Claims Intake Modernization Review",
    manifestId: SHOWCASE_STATIC_DEMO_MANIFEST_ID,
    findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    title: "PHI Minimization Risk",
    severity: "High",
    category: "Privacy / regulated data",
    status: "Accepted · monitoring · non-blocking",
    recommended:
      "Review PHI handling posture with intake and security owners before production rollout; weekly exception-volume review while monitored.",
    recordKind: "finding",
    traceConfidenceLevel: "Medium",
    systemName: "Claims Intake Platform",
    resourceId:
      "/subscriptions/demo/resourceGroups/ClaimsIntakeRg/providers/Microsoft.KeyVault/vaults/claims-kv-1",
  };
}

function staticDemoGovernanceRows(): GovernanceFindingQueueRow[] {
  const phi = demoPhiRow();
  const decisionRows: GovernanceFindingQueueRow[] = SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES.slice(0, 8).map((syn, i) => ({
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    runLabel: "Claims Intake Modernization Review",
    manifestId: SHOWCASE_STATIC_DEMO_MANIFEST_ID,
    findingId: `showcase-decision-${i + 1}`,
    title: syn.length > 96 ? `${syn.slice(0, 93)}…` : syn,
    severity: "Info",
    category: "Architecture decision",
    status: "Recorded",
    recommended:
      SHOWCASE_GOVERNANCE_DECISION_RECOMMENDED[i] ??
      "Document acceptance with owning teams in the next design review.",
    recordKind: "decision",
  }));

  return [phi, ...decisionRows];
}

function riskRegisterRows(entries: ArchitectureRiskRegisterEntry[]): GovernanceFindingQueueRow[] {
  return entries.map((entry) => {
    const runId = (entry.runId ?? "").trim();
    const systemName = (entry.systemName ?? "").trim();
    const resourceId = (entry.resourceId ?? "").trim();
    const recommended =
      entry.latestDisposition !== null && entry.latestDisposition !== undefined
        ? `Latest disposition: ${entry.latestDisposition}. Owner: ${entry.ownerUserId ?? "unassigned"}.`
        : "Open the finding inspector to record disposition or a time-bounded waiver.";
    const runLabel =
      systemName.length > 0 ? systemName : runId.length > 0 ? runId : "—";

    return {
      runId: runId.length > 0 ? runId : "—",
      runLabel,
      manifestId: (entry.manifestId ?? "").trim().length > 0 ? (entry.manifestId ?? "").trim() : "—",
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

function decisionRegisterRows(entries: ArchitectureDecisionRegisterEntry[]): GovernanceFindingQueueRow[] {
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
          : "Open the signed review record for decision context and supporting findings.";

    return {
      runId: runId.length > 0 ? runId : "—",
      runLabel: runId.length > 0 ? runId : "—",
      manifestId: manifestId.length > 0 ? manifestId : "—",
      findingId: entry.decisionId,
      title: titleRaw.length > 0 ? titleRaw : entry.decisionId,
      severity: "Info",
      category: (entry.category ?? "").trim().length > 0 ? entry.category : "Architecture decision",
      status: "Recorded",
      recommended,
      recordKind: "decision",
      traceConfidenceLevel: null,
      lastReviewedUtc: entry.recordedAtUtc ?? null,
      evidenceHref: manifestId.length > 0 ? `/signed-records/${encodeURIComponent(manifestId)}` : undefined,
    };
  });
}

function traceRowsForRun(run: RunSummary, traces: FindingTraceConfidenceDto[]): GovernanceFindingQueueRow[] {
  return traces
    .filter((t) => (t.findingId ?? "").trim().length > 0)
    .map((t) => {
      const findingId = t.findingId.trim();
      const titleRaw = (t.findingTitle ?? findingId).trim();
      const manifestRaw = isDemoRunIdEligibleForStaticFallback(run.runId)
        ? SHOWCASE_STATIC_DEMO_MANIFEST_ID
        : "—";

      const ruleHint = (t.ruleId ?? "").trim();
      const runDescription = (run.description ?? "").trim();
      const runLabel = runDescription.length > 0 ? runDescription : run.runId;

      return {
        runId: run.runId,
        runLabel,
        manifestId: manifestRaw.length > 0 ? manifestRaw : "—",
        findingId,
        title: titleRaw.length > 0 ? titleRaw : findingId,
        severity: severityFromTrace(t.traceConfidenceLabel),
        category: (t.ruleId ?? "—").replace(/;/g, ", "),
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

function dedupeRows(rows: GovernanceFindingQueueRow[]): GovernanceFindingQueueRow[] {
  const seen = new Set<string>();
  const out: GovernanceFindingQueueRow[] = [];

  for (const r of rows) {
    const key = `${r.runId}:${r.findingId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    out.push(r);
  }

  return out;
}

function inspectHref(runId: string, findingId: string): string {
  return `/reviews/${encodeURIComponent(runId)}/findings/${encodeURIComponent(findingId)}/inspect`;
}

function governanceQueueGraphEvidenceHref(row: GovernanceFindingQueueRow): string | null {
  if (row.recordKind !== "finding") {
    return null;
  }

  const focused = preferredGraphNodeIdForFindingDeepLink(row.runId, row.findingId);

  if (focused !== null) {
    return graphTrailHrefWithOptionalNode(row.runId, focused);
  }

  const level = row.traceConfidenceLevel;

  if (level === "High" || level === "Medium" || level === "Low") {
    return graphTrailHrefWithOptionalNode(row.runId, null);
  }

  return null;
}

function manifestRecordHref(runId: string, manifestId: string): string {
  if (manifestId !== "—") {
    return `/signed-records/${encodeURIComponent(manifestId)}`;
  }

  return `/reviews/${encodeURIComponent(runId)}/signed-record`;
}

function navigateGovernanceRowDetail(
  router: ReturnType<typeof useRouter>,
  runId: string,
  findingId: string,
): void {
  router.push(inspectHref(runId, findingId));
}

function governanceRowDetailKeyboardActivate(
  event: KeyboardEvent,
  router: ReturnType<typeof useRouter>,
  runId: string,
  findingId: string,
): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  navigateGovernanceRowDetail(router, runId, findingId);
}

function GovernanceFindingsBuyerMobileRow(props: { readonly row: GovernanceFindingQueueRow }): ReactElement {
  const row = props.row;
  const graphHref = governanceQueueGraphEvidenceHref(row);
  const router = useRouter();
  const rowIsDecision = row.recordKind === "decision";

  return (
    <Card
      className={
        rowIsDecision
          ? "cursor-pointer border border-neutral-200 shadow-sm transition-colors hover:border-neutral-300 hover:bg-[var(--al-layer-hover)] dark:hover:border-neutral-700 dark:hover:bg-neutral-800/80"
          : "border border-neutral-200 shadow-sm dark:border-neutral-800"
      }
      onClick={rowIsDecision ? () => navigateGovernanceRowDetail(router, row.runId, row.findingId) : undefined}
      onKeyDown={
        rowIsDecision
          ? (event) => governanceRowDetailKeyboardActivate(event, router, row.runId, row.findingId)
          : undefined
      }
      tabIndex={rowIsDecision ? 0 : undefined}
      role={rowIsDecision ? "button" : undefined}
      aria-label={rowIsDecision ? `Open decision: ${row.title}` : undefined}
    >
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}>
          <Link
            className={OPERATOR_LINK.inline}
            href={inspectHref(row.runId, row.findingId)}
          >
            {row.title}
          </Link>
        </CardTitle>
        {row.recordKind === "finding" && row.policyRuleId ? (
          <FindingPolicyTraceabilityBadges
            className="mt-1"
            {...buildPolicyTraceabilityLinksFromRuleId(row.policyRuleId, row.category || row.policyRuleId)}
          />
        ) : null}
      </CardHeader>
      <CardContent className={cn("grid gap-3 pt-0", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <div className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Record type</div>
          <p className="m-0 mt-0.5 text-al-text-secondary">
            {governanceBuyerRecordTypePrimary(row)}
            {governanceBuyerRecordTypeSecondary(row) !== null ? (
              <>
                <br />
                <span className="text-neutral-700 dark:text-neutral-300">{governanceBuyerRecordTypeSecondary(row)}</span>
              </>
            ) : null}
          </p>
        </div>
        <div>
          <div className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Status</div>
          <p className="m-0 mt-0.5 text-al-text-secondary">{row.status}</p>
          {row.recordKind === "finding" && row.humanReviewStatusLabel ? (
            <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.humanReviewStatusLabel}</p>
          ) : null}
          {row.recordKind === "finding" && row.itsmLinkedTicketsSummary ? (
            <p className={cn("m-0 mt-0.5 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
              ITSM: {row.itsmLinkedTicketsSummary}
            </p>
          ) : null}
        </div>
        <div>
          <div className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Recommended action</div>
          <p className="m-0 mt-0.5 text-al-text-secondary">{row.recommended}</p>
        </div>
        {row.recordKind === "finding" ? (
          <details className={cn("rounded-md border border-neutral-200 bg-neutral-50/80 px-2 py-2 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}>
            <summary className={cn("cursor-pointer select-none font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              Severity, confidence, and review
            </summary>
            <p className="m-0 mt-2">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Severity</span> {row.severity}
            </p>
            <p className="m-0 mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Confidence</span>
              {row.traceConfidenceLevel === "High" ||
              row.traceConfidenceLevel === "Medium" ||
              row.traceConfidenceLevel === "Low" ? (
                <FindingConfidenceBadge level={row.traceConfidenceLevel} />
              ) : (
                <span className="text-neutral-500">—</span>
              )}
            </p>
            <p className="m-0 mt-2">
              <span className="font-medium text-neutral-800 dark:text-neutral-200">Review</span>{" "}
              <Link
                className={OPERATOR_LINK.inline}
                href={`/reviews/${encodeURIComponent(row.runId)}`}
              >
                {row.runLabel}
              </Link>
            </p>
          </details>
        ) : null}
        {row.recordKind === "finding" ? (
          <div className="flex flex-col gap-2">
            <CopyGovernanceQueueWorkItemButton
              runId={row.runId}
              findingId={row.findingId}
              findingTitle={row.title}
              severityLabel={row.severity}
              recommendedAction={row.recommended}
              statusLabel={row.status}
              compact
            />
          </div>
        ) : null}
        {graphHref !== null ? (
          <p className="m-0">
            <Link
              className={OPERATOR_LINK.inline}
              href={graphHref}
            >
              {BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA}
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * Findings hub: cross-run queue from explainability aggregates, plus a deterministic PHI sample row in public demo mode.
 */
export default function GovernanceFindingsQueueClient() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<GovernanceFindingQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [registerFilter, setRegisterFilter] = useState<RiskRegisterFilter>(() =>
    riskRegisterFilterFromQuery(searchParams.get("filter")),
  );
  const [selectedFindingIds, setSelectedFindingIds] = useState<ReadonlySet<string>>(new Set());
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>(() => loadSavedPresets());
  const [groupByResource, setGroupByResource] = useState(false);

  useEffect(() => {
    setGroupByResource(readGroupByResourcePreference());
  }, []);

  const saveCurrentFilterAsPreset = (): void => {
    if (registerFilter === "all") {
      return;
    }

    const label = FILTER_PRESET_LABELS[registerFilter];
    const alreadySaved = savedPresets.some((p) => p.filter === registerFilter);

    if (alreadySaved) {
      return;
    }

    const newPreset: FilterPreset = { id: `${registerFilter}-${Date.now()}`, label, filter: registerFilter };
    const updated = [...savedPresets, newPreset];

    setSavedPresets(updated);
    savePresetsToStorage(updated);
  };

  const removePreset = (id: string): void => {
    const updated = savedPresets.filter((p) => p.id !== id);

    setSavedPresets(updated);
    savePresetsToStorage(updated);
  };

  useEffect(() => {
    setRegisterFilter(riskRegisterFilterFromQuery(searchParams.get("filter")));
  }, [searchParams]);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const displayedRows = useMemo(
    () => rows.filter((row) => matchesRiskRegisterFilter(row, registerFilter)),
    [rows, registerFilter],
  );
  const registerSummary = useMemo(() => computeArchitectureRiskRegisterSummary(rows), [rows]);
  const findingRows = displayedRows.filter((row) => row.recordKind === "finding");
  const decisionRows = displayedRows.filter((row) => row.recordKind === "decision");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadFailed(false);

      const useCuratedDemoSpine = shouldUseGovernanceCuratedDemoSpine();

      if (useCuratedDemoSpine) {
        if (!cancelled) {
          setRows(staticDemoGovernanceRows());
          setLoading(false);
        }

        return;
      }

      try {
        const [riskRegister, decisionRegister] = await Promise.all([
          getArchitectureRiskRegister(),
          getArchitectureDecisionRegister(),
        ]);
        const registerRows = dedupeRows([
          ...riskRegisterRows(riskRegister.entries ?? []),
          ...decisionRegisterRows(decisionRegister.decisions ?? []),
        ]);

        if (registerRows.length > 0) {
          if (!cancelled) {
            setRows(registerRows);
            setLoading(false);
          }

          return;
        }

        const page = await listRunsByProjectPaged("default", 1, 25);
        const runItems = page.items ?? [];
        const maxRuns = Math.min(runItems.length, 12);
        const slice = runItems.slice(0, maxRuns);
        const collected: GovernanceFindingQueueRow[] = [];

        await Promise.all(
          slice.map(async (r) => {
            try {
              const summary = await getRunExplanationSummary(r.runId);
              const traces =
                summary.findingTraceConfidences ?? summary.explanation?.findingTraceConfidences ?? [];

              if (traces === null || traces.length === 0) {
                return;
              }

              collected.push(...traceRowsForRun(r, traces));
            } catch {
              /* omit runs that cannot load aggregate (permissions, draft run, etc.) */
            }
          }),
        );

        if (cancelled) {
          return;
        }

        let merged = dedupeRows(collected);

        if (merged.length === 0 && useCuratedDemoSpine) {
          merged = staticDemoGovernanceRows();
        } else if (useCuratedDemoSpine) {
          const hasPhi = merged.some((x) => x.findingId === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID);

          if (!hasPhi) {
            merged = [demoPhiRow(), ...merged];
          }
        }

        setRows(merged);
      } catch {
        if (cancelled) {
          return;
        }

        setLoadFailed(true);
        setRows(useCuratedDemoSpine ? staticDemoGovernanceRows() : []);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  return (
    <>
      <LayerHeader pageKey="governance-findings" density="compact" />
      {buyerPolishedShell ? (
        <nav aria-label="Breadcrumb" className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          <Link className={OPERATOR_LINK.inline} href={`/governance?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}>
            Governance approval
          </Link>
          {" · "}
          <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} aria-current="page">
            Review records and dispositions
          </span>
        </nav>
      ) : null}
      <OperatorPageHeader
        title={buyerPolishedShell ? BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE : ARCHITECTURE_RISK_REGISTER_PAGE_TITLE}
        subtitle={
          buyerPolishedShell ? undefined : ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE
        }
        titleTestId="architecture-risk-register-page-title"
        metadata={
          !buyerPolishedShell && !loading ? (
            <>
              <span data-testid="architecture-risk-register-summary-open">
                Open risks: {registerSummary.openRisks}
              </span>
              <span data-testid="architecture-risk-register-summary-expiring">
                Expiring exceptions: {registerSummary.expiringExceptions}
              </span>
              <span data-testid="architecture-risk-register-summary-owner">
                Pending owner: {registerSummary.pendingOwner}
              </span>
              <span data-testid="architecture-risk-register-summary-overdue">
                Overdue review: {registerSummary.overdueReview}
              </span>
            </>
          ) : undefined
        }
      />

        <div className={cn("mt-4", OPERATOR_LAYOUT.sectionStack)}>
        {buyerPolishedShell ? (
          <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD}{" "}
            <Link
              className={OPERATOR_LINK.inline}
              href={`/governance?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}
            >
              Governance approval
            </Link>
            .
          </p>
        ) : null}

        {!buyerPolishedShell && !loading && rows.length > 0 ? (
          <div className="space-y-2">
            <div
              className="flex flex-wrap items-center gap-2"
              data-testid="architecture-risk-register-filters"
              aria-label="Risk register filters"
            >
              <Button
                type="button"
                size="sm"
                variant={registerFilter === "all" ? "default" : "outline"}
                onClick={() => setRegisterFilter("all")}
              >
                {RISK_REGISTER_FILTER_LABELS.all}
              </Button>
              {RISK_REGISTER_QUICK_FILTERS.map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  size="sm"
                  variant={registerFilter === filter ? "default" : "outline"}
                  onClick={() => setRegisterFilter(filter)}
                >
                  {RISK_REGISTER_FILTER_LABELS[filter]}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={registerFilter === "stale" ? "default" : "outline"}
                onClick={() => setRegisterFilter("stale")}
              >
                {RISK_REGISTER_FILTER_LABELS.stale}
              </Button>
              {registerFilter !== "all" && !savedPresets.some((p) => p.filter === registerFilter) ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn("h-7 gap-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  title="Save this filter as a named preset for quick access"
                  onClick={saveCurrentFilterAsPreset}
                >
                  <span aria-hidden="true">⊕</span> Save as preset
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => downloadArchitectureRiskRegisterCsv(displayedRows)}
              >
                Export CSV
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-testid="governance-findings-export-json-button"
                onClick={() => {
                  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";
                  downloadGovernanceFindingsItsmJsonExport(displayedRows, siteOrigin);
                }}
              >
                Export JSON (work items)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={groupByResource ? "default" : "outline"}
                aria-pressed={groupByResource}
                onClick={() => {
                  const next = !groupByResource;

                  setGroupByResource(next);
                  writeGroupByResourcePreference(next);
                }}
              >
                Group by resource
              </Button>
            </div>

            {savedPresets.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5" aria-label="Saved filter presets">
                <span className={OPERATOR_NAV_GROUP_LABEL}>
                  Presets:
                </span>
                {savedPresets.map((preset) => (
                  <span
                    key={preset.id}
                    className={cn("inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-0.5 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}
                  >
                    <button
                      type="button"
                      className="hover:text-teal-700 dark:hover:text-teal-300"
                      onClick={() => setRegisterFilter(preset.filter)}
                    >
                      {preset.label}
                    </button>
                    <button
                      type="button"
                      className="ml-0.5 text-neutral-400 hover:text-red-500 dark:hover:text-red-400"
                      aria-label={`Remove preset "${preset.label}"`}
                      onClick={() => removePreset(preset.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading findings…</p>
        ) : null}

        {!loading && rows.length > 0 && displayedRows.length === 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            No risks match the selected filter. Try All or choose a different operational filter.
          </p>
        ) : null}

        {!loading && displayedRows.length > 0 ? (
          buyerPolishedShell ? (
            <div className="space-y-4">
              {findingRows.length > 0 ? (
                <section className="space-y-3" aria-labelledby="governance-findings-risks">
                  <h2
                    id="governance-findings-risks"
                    className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
                  >
                    {BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE}
                  </h2>
                  <div className="space-y-3">
                    {findingRows.map((row) => (
                      <GovernanceFindingsBuyerMobileRow key={`${row.runId}:${row.findingId}:mfind`} row={row} />
                    ))}
                  </div>
                </section>
              ) : null}
              {decisionRows.length > 0 ? (
                <section className="space-y-3" aria-labelledby="governance-findings-decisions">
                  <h2
                    id="governance-findings-decisions"
                    className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
                  >
                    Recorded decisions
                  </h2>
                  <div className="space-y-3">
                    {decisionRows.map((row) => (
                      <GovernanceFindingsBuyerMobileRow key={`${row.runId}:${row.findingId}:mdec`} row={row} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
          <>
            {selectedFindingIds.size > 0 ? (
              <div className="mb-2">
                <GovernanceFindingsBulkActions
                  selectedFindingIds={Array.from(selectedFindingIds)}
                  onApplied={() => {
                    setSelectedFindingIds(new Set());
                    setRefreshTrigger((prev) => prev + 1);
                  }}
                />
              </div>
            ) : null}
            <GovernanceFindingsQueueDesktopTable
              rows={displayedRows}
              buyerPolishedShell={buyerPolishedShell}
              groupByResource={groupByResource}
              selectedFindingIds={selectedFindingIds}
              onSelectionChange={setSelectedFindingIds}
            />

            <div className="space-y-3 md:hidden">
              {displayedRows.map((row) => (
              <Card
                key={`${row.runId}:${row.findingId}`}
                className="border border-neutral-200 shadow-sm dark:border-neutral-800"
              >
                <CardHeader className="space-y-1 pb-2">
                  <CardTitle className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}>
                    <Link
                      className={OPERATOR_LINK.inline}
                      href={inspectHref(row.runId, row.findingId)}
                    >
                      {row.title}
                    </Link>
                  </CardTitle>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {buyerPolishedShell ? (
                      row.runLabel
                    ) : (
                      <span className="inline-flex flex-wrap items-center gap-1">
                        <span>{`${row.runLabel} · ${row.findingId}`}</span>
                        <CopyIdButton value={row.findingId} aria-label="Copy finding ID" />
                      </span>
                    )}
                  </p>
                  <div className={cn("mt-2 grid gap-3 border-t border-neutral-100 pt-2 sm:grid-cols-3 dark:border-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>
                    {buyerPolishedShell ? null : (
                      <div>
                        <div className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{SIGNED_MANIFEST_LABEL}</div>
                        <div className="mt-0.5">
                          <Link
                            className={OPERATOR_LINK.inline}
                            href={manifestRecordHref(row.runId, row.manifestId)}
                          >
                            Open signed record
                          </Link>
                        </div>
                      </div>
                    )}
                    <div className={buyerPolishedShell ? "sm:col-span-1" : undefined}>
                      <div className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Review</div>
                      <div className="mt-0.5">
                        <Link
                          className={OPERATOR_LINK.inline}
                          href={`/reviews/${encodeURIComponent(row.runId)}`}
                        >
                          {row.runLabel}
                        </Link>
                      </div>
                    </div>
                    <div className="sm:col-span-1">
                      <div className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Recommended action</div>
                      <p className="m-0 mt-0.5 text-al-text-secondary">{row.recommended}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={cn("grid gap-2 pt-0 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
                  <div>
                    <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
                      {buyerPolishedShell ? "Record" : "Record kind"}
                    </span>
                    <p className="m-0 mt-0.5 text-al-text-secondary">
                      {formatGovernanceQueueRecordKind(row.recordKind, buyerPolishedShell)}
                    </p>
                  </div>
                  <div>
                    <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Severity</span>
                    <p className="m-0 mt-0.5 text-al-text-secondary">
                      {buyerPolishedShell && row.recordKind === "decision" ? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Severity does not apply to recorded decision rows.</span>
                        </>
                      ) : (
                        row.severity
                      )}
                    </p>
                  </div>
                  {buyerPolishedShell && row.recordKind === "finding" ? (
                    <div>
                      <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Confidence</span>
                      <div className="mt-0.5">
                        {row.traceConfidenceLevel === "High" ||
                        row.traceConfidenceLevel === "Medium" ||
                        row.traceConfidenceLevel === "Low" ? (
                          <FindingConfidenceBadge level={row.traceConfidenceLevel} />
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-500">—</span>
                        )}
                      </div>
                    </div>
                  ) : null}
                  {buyerPolishedShell ? null : (
                    <div>
                      <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Category</span>
                      {row.recordKind === "finding" && row.policyRuleId ? (
                        <div className="mt-0.5">
                          <FindingPolicyTraceabilityBadges
                            {...buildPolicyTraceabilityLinksFromRuleId(row.policyRuleId, row.category || row.policyRuleId)}
                          />
                        </div>
                      ) : (
                        <p className="m-0 mt-0.5 text-al-text-secondary">{row.category}</p>
                      )}
                    </div>
                  )}
                  <div>
                    <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>Status</span>
                    <p className="m-0 mt-0.5 text-al-text-secondary">{row.status}</p>
                    {row.recordKind === "finding" && row.humanReviewStatusLabel ? (
                      <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {row.humanReviewStatusLabel}
                      </p>
                    ) : null}
                    {row.recordKind === "finding" && row.itsmLinkedTicketsSummary ? (
                      <p className={cn("m-0 mt-0.5 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                        ITSM: {row.itsmLinkedTicketsSummary}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    {row.recordKind === "finding" ? (
                      <>
                        <CopyGovernanceQueueWorkItemButton
                          runId={row.runId}
                          findingId={row.findingId}
                          findingTitle={row.title}
                          severityLabel={row.severity}
                          recommendedAction={row.recommended}
                          statusLabel={row.status}
                          compact
                        />
                        {!buyerPolishedShell ? <ItsmOutboundQuickActions findingId={row.findingId} compact /> : null}
                      </>
                    ) : null}
                    <Button asChild variant="outline" size="sm" className="h-9 border-teal-300 dark:border-teal-700">
                      <Link href={inspectHref(row.runId, row.findingId)}>
                        {buyerPolishedShell
                          ? row.recordKind === "decision"
                            ? "View decision"
                            : BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA
                          : "Open finding"}
                      </Link>
                    </Button>
                    {(() => {
                      const graphHref = governanceQueueGraphEvidenceHref(row);

                      return graphHref !== null ? (
                        <Button asChild variant="outline" size="sm" className="h-9 border-neutral-300 dark:border-neutral-600">
                          <Link href={graphHref}>{BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA}</Link>
                        </Button>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </>
          )
        ) : null}

        {!loading && rows.length === 0 ? (
          <EnterpriseCompactEmptyState
            testId="governance-findings-empty-state"
            title={ARCHITECTURE_RISK_REGISTER_EMPTY_TITLE}
            description={
              loadFailed
                ? buyerPolishedShell
                  ? "We could not load the architecture risk register for this workspace. Check your connection, or return to reviews and try again."
                  : "We could not load the architecture risk register for this workspace — check connectivity, then open the curated Claims Intake example if you are in demo mode."
                : ARCHITECTURE_RISK_REGISTER_EMPTY_BODY
            }
            actions={[
              { label: "Open review packages", href: "/reviews?projectId=default", variant: "primary" },
              {
                label: buyerPolishedShell ? BUYER_GOVERNANCE_PAGE_TITLE : "Open governance workflow",
                href: "/governance",
                variant: "outline",
              },
            ]}
            footer={
              !buyerPolishedShell ? (
                <Link className={OPERATOR_LINK.inline} href={ARCHITECTURE_RISK_REGISTER_POLICY_PACKS_HREF}>
                  View policy packs
                </Link>
              ) : undefined
            }
          />
        ) : null}

        {!loading && rows.length === 0 && !buyerPolishedShell ? (
          <details className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
            <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              What the risk register contains
            </summary>
            <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {ARCHITECTURE_RISK_REGISTER_CONTAINS_COPY}
            </p>
          </details>
        ) : null}
        <ProductConceptsGlossary
          className="mt-4"
          entries={[...ARCHITECTURE_RISK_REGISTER_GLOSSARY]}
          defaultOpen={false}
        />
      </div>
    </>
  );
}
