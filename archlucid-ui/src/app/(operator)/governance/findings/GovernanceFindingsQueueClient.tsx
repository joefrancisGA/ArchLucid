"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type KeyboardEvent, type ReactElement } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { ProductConceptsGlossary } from "@/components/ProductConceptsGlossary";
import { Button } from "@/components/ui/button";
import { GovernanceFindingsQueueDesktopTable } from "./GovernanceFindingsQueueDesktopTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRunExplanationSummary, listRunsByProjectPaged } from "@/lib/api";
import {
  getArchitectureRiskRegister,
  type ArchitectureRiskRegisterEntry,
} from "@/lib/api/governance-stickiness-api";
import { formatFindingHumanReviewStatusLabel } from "@/lib/finding-human-review-display";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";
import { downloadArchitectureRiskRegisterCsv } from "@/lib/architecture-risk-register-csv";
import { severityFromTrace } from "@/lib/executive-finding-severity";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";
import { isDemoRunIdEligibleForStaticFallback } from "@/lib/operator-static-demo";
import {
  BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD,
  BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE,
  BUYER_GOVERNANCE_FINDINGS_RISKS_SECTION_TITLE,
  BUYER_GOVERNANCE_FINDINGS_VIEW_EVIDENCE_TRAIL_CTA,
  BUYER_GOVERNANCE_FINDINGS_EMPTY,
  BUYER_GOVERNANCE_FINDINGS_VIEW_OBSERVATION_CTA,
  BUYER_GOVERNANCE_PAGE_TITLE,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { shouldUseGovernanceCuratedDemoSpine } from "@/lib/buyer-demo-content-gating";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";
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

type RiskRegisterFilter = "all" | "stale" | "waiver-expiring";

const WAIVER_EXPIRING_WINDOW_DAYS = 14;

function riskRegisterFilterFromQuery(raw: string | null): RiskRegisterFilter {
  if (raw === "stale") {
    return "stale";
  }

  if (raw === "waiver-expiring") {
    return "waiver-expiring";
  }

  return "all";
}

function matchesRiskRegisterFilter(row: GovernanceFindingQueueRow, filter: RiskRegisterFilter): boolean {
  if (filter === "all") {
    return true;
  }

  if (row.recordKind !== "finding") {
    return false;
  }

  if (filter === "stale") {
    return row.isStale === true;
  }

  const expiresRaw = row.waiverExpiresAtUtc?.trim() ?? "";

  if (expiresRaw.length === 0) {
    return false;
  }

  const expiresMs = Date.parse(expiresRaw);

  if (Number.isNaN(expiresMs)) {
    return false;
  }

  const windowMs = WAIVER_EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return expiresMs <= Date.now() + windowMs;
}

// ---------------------------------------------------------------------------
// Saved filter presets (localStorage, no backend required)
// ---------------------------------------------------------------------------

const FILTER_PRESET_STORAGE_KEY = "archlucid.governance.filterPresets.v1";

type FilterPreset = {
  readonly id: string;
  readonly label: string;
  readonly filter: RiskRegisterFilter;
};

const FILTER_PRESET_LABELS: Record<RiskRegisterFilter, string> = {
  all: "All risks",
  stale: "Stale",
  "waiver-expiring": "Waiver expiring (14d)",
};

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
    const recommended =
      entry.latestDisposition !== null && entry.latestDisposition !== undefined
        ? `Latest disposition: ${entry.latestDisposition}. Owner: ${entry.ownerUserId ?? "unassigned"}.`
        : "Open the finding inspector to record disposition or a time-bounded waiver.";

    return {
      runId: runId.length > 0 ? runId : "—",
      runLabel: runId.length > 0 ? runId : "—",
      manifestId: entry.manifestId ?? "—",
      findingId: entry.findingId,
      title: entry.title,
      severity: entry.severity,
      category: entry.category,
      status: entry.isStale ? `${entry.statusLabel} · stale` : entry.statusLabel,
      recommended,
      recordKind: "finding",
      traceConfidenceLevel: null,
      ownerUserId: entry.ownerUserId ?? null,
      agingDays: entry.agingDays,
      waiverExpiresAtUtc: entry.waiverExpiresAtUtc ?? null,
      revisitDueUtc: entry.revisitDueUtc ?? null,
      isStale: entry.isStale,
      evidenceHref: entry.evidenceHref,
      humanReviewStatusLabel: formatFindingHumanReviewStatusLabel(entry.humanReviewStatus),
      itsmLinkedTicketsSummary:
        (entry.itsmLinkedTicketsSummary ?? "").trim().length > 0
          ? (entry.itsmLinkedTicketsSummary ?? "").trim()
          : null,
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

      return {
        runId: run.runId,
        runLabel: ((run.description ?? "").trim().length > 0 ? run.description : run.runId) ?? run.runId,
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
    return `/manifests/${encodeURIComponent(manifestId)}`;
  }

  return `/reviews/${encodeURIComponent(runId)}/manifest`;
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
        <CardTitle className="text-sm font-semibold text-al-text-primary">
          <Link
            className="text-teal-800 underline hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            href={inspectHref(row.runId, row.findingId)}
          >
            {row.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-0 text-sm">
        <div>
          <div className="font-medium text-neutral-700 dark:text-neutral-300">Record type</div>
          <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">
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
          <div className="font-medium text-neutral-700 dark:text-neutral-300">Status</div>
          <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">{row.status}</p>
          {row.recordKind === "finding" && row.humanReviewStatusLabel ? (
            <p className="m-0 mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">{row.humanReviewStatusLabel}</p>
          ) : null}
          {row.recordKind === "finding" && row.itsmLinkedTicketsSummary ? (
            <p className="m-0 mt-0.5 font-mono text-xs text-neutral-500 dark:text-neutral-500">
              ITSM: {row.itsmLinkedTicketsSummary}
            </p>
          ) : null}
        </div>
        <div>
          <div className="font-medium text-neutral-700 dark:text-neutral-300">Recommended action</div>
          <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">{row.recommended}</p>
        </div>
        {row.recordKind === "finding" ? (
          <details className="rounded-md border border-neutral-200 bg-neutral-50/80 px-2 py-2 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-400">
            <summary className="cursor-pointer select-none font-medium text-neutral-700 dark:text-neutral-300">
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
                className="text-teal-800 underline dark:text-teal-300"
                href={`/reviews/${encodeURIComponent(row.runId)}`}
              >
                {row.runLabel}
              </Link>
            </p>
          </details>
        ) : null}
        {graphHref !== null ? (
          <p className="m-0">
            <Link
              className="text-sm font-medium text-teal-800 underline underline-offset-2 dark:text-teal-300"
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
  const [registerFilter, setRegisterFilter] = useState<RiskRegisterFilter>(() =>
    riskRegisterFilterFromQuery(searchParams.get("filter")),
  );
  const [selectedFindingIds, setSelectedFindingIds] = useState<ReadonlySet<string>>(new Set());
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>(() => loadSavedPresets());

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
        const riskRegister = await getArchitectureRiskRegister();
        const registerRows = riskRegisterRows(riskRegister.entries ?? []);

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
  }, []);

  return (
    <>
      <LayerHeader pageKey="governance-findings" density="compact" />
      {buyerPolishedShell ? (
        <nav aria-label="Breadcrumb" className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          <Link className="text-teal-800 underline dark:text-teal-300" href="/">
            Home
          </Link>
          {" · "}
          <Link className="text-teal-800 underline dark:text-teal-300" href={`/governance?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}>
            Governance approval
          </Link>
          {" · "}
          <span className="font-medium text-neutral-800 dark:text-neutral-200" aria-current="page">
            Review records and dispositions
          </span>
        </nav>
      ) : null}
      <OperatorPageHeader
        title={buyerPolishedShell ? BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE : "Architecture risk register"}
      />

        <div className={cn("mt-4", OPERATOR_LAYOUT.sectionStack)}>
        <p className="m-0 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
          {buyerPolishedShell ? (
            <>
              {BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD}{" "}
              <Link
                className="font-medium text-teal-800 underline dark:text-teal-300"
                href={`/governance?runId=${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}
              >
                Governance approval
              </Link>
              .
            </>
          ) : (
            "Owned architecture risks across reviews — disposition, owner, aging, stale cadence, and evidence links."
          )}
        </p>

        {!buyerPolishedShell && !loading && rows.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={registerFilter === "all" ? "default" : "outline"}
                onClick={() => setRegisterFilter("all")}
              >
                All risks
              </Button>
              <Button
                type="button"
                size="sm"
                variant={registerFilter === "stale" ? "default" : "outline"}
                onClick={() => setRegisterFilter("stale")}
              >
                Stale
              </Button>
              <Button
                type="button"
                size="sm"
                variant={registerFilter === "waiver-expiring" ? "default" : "outline"}
                onClick={() => setRegisterFilter("waiver-expiring")}
              >
                Waiver expiring (14d)
              </Button>
              {registerFilter !== "all" && !savedPresets.some((p) => p.filter === registerFilter) ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs text-neutral-500 dark:text-neutral-400"
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
            </div>

            {savedPresets.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5" aria-label="Saved filter presets">
                <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Presets:
                </span>
                {savedPresets.map((preset) => (
                  <span
                    key={preset.id}
                    className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-0.5 text-xs text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
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
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">Loading findings…</p>
        ) : null}

        {!loading && rows.length > 0 && displayedRows.length === 0 ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            No risks match the selected filter. Try All risks or adjust waiver/stale criteria.
          </p>
        ) : null}

        {!loading && displayedRows.length > 0 ? (
          buyerPolishedShell ? (
            <div className="space-y-4">
              {findingRows.length > 0 ? (
                <section className="space-y-3" aria-labelledby="governance-findings-risks">
                  <h2
                    id="governance-findings-risks"
                    className="m-0 text-sm font-semibold text-al-text-primary"
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
                    className="m-0 text-sm font-semibold text-al-text-primary"
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
              <div
                className="mb-2 flex flex-wrap items-center gap-3 rounded-md border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm dark:border-teal-800 dark:bg-teal-950/30"
                role="status"
                aria-live="polite"
              >
                <span className="font-medium text-teal-900 dark:text-teal-100">
                  {selectedFindingIds.size} finding{selectedFindingIds.size === 1 ? "" : "s"} selected
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => { setSelectedFindingIds(new Set()); }}
                >
                  Clear selection
                </Button>
              </div>
            ) : null}
            <GovernanceFindingsQueueDesktopTable
              rows={displayedRows}
              buyerPolishedShell={buyerPolishedShell}
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
                  <CardTitle className="text-sm font-semibold text-al-text-primary">
                    <Link
                      className="text-teal-800 underline hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                      href={inspectHref(row.runId, row.findingId)}
                    >
                      {row.title}
                    </Link>
                  </CardTitle>
                  <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
                    {buyerPolishedShell ? (
                      row.runLabel
                    ) : (
                      <span className="inline-flex flex-wrap items-center gap-1">
                        <span>{`${row.runLabel} · ${row.findingId}`}</span>
                        <CopyIdButton value={row.findingId} aria-label="Copy finding ID" />
                      </span>
                    )}
                  </p>
                  <div className="mt-2 grid gap-3 border-t border-neutral-100 pt-2 text-xs sm:grid-cols-3 dark:border-neutral-800">
                    {buyerPolishedShell ? null : (
                      <div>
                        <div className="font-medium text-neutral-600 dark:text-neutral-400">Manifest</div>
                        <div className="mt-0.5">
                          <Link
                            className="text-teal-800 underline hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                            href={manifestRecordHref(row.runId, row.manifestId)}
                          >
                            Open signed record
                          </Link>
                        </div>
                      </div>
                    )}
                    <div className={buyerPolishedShell ? "sm:col-span-1" : undefined}>
                      <div className="font-medium text-neutral-600 dark:text-neutral-400">Review</div>
                      <div className="mt-0.5">
                        <Link
                          className="text-teal-800 underline hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
                          href={`/reviews/${encodeURIComponent(row.runId)}`}
                        >
                          {row.runLabel}
                        </Link>
                      </div>
                    </div>
                    <div className="sm:col-span-1">
                      <div className="font-medium text-neutral-600 dark:text-neutral-400">Recommended action</div>
                      <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">{row.recommended}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-2 pt-0 text-sm sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {buyerPolishedShell ? "Record" : "Record kind"}
                    </span>
                    <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">
                      {formatGovernanceQueueRecordKind(row.recordKind, buyerPolishedShell)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Severity</span>
                    <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">
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
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">Confidence</span>
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
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">Category</span>
                      <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">{row.category}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">Status</span>
                    <p className="m-0 mt-0.5 text-neutral-600 dark:text-neutral-400">{row.status}</p>
                    {row.recordKind === "finding" && row.humanReviewStatusLabel ? (
                      <p className="m-0 mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">
                        {row.humanReviewStatusLabel}
                      </p>
                    ) : null}
                    {row.recordKind === "finding" && row.itsmLinkedTicketsSummary ? (
                      <p className="m-0 mt-0.5 font-mono text-xs text-neutral-500 dark:text-neutral-500">
                        ITSM: {row.itsmLinkedTicketsSummary}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    {!buyerPolishedShell && row.recordKind === "finding" ? (
                      <ItsmOutboundQuickActions findingId={row.findingId} compact />
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
            title="No findings to display"
            description={
              loadFailed
                ? buyerPolishedShell
                  ? "We could not load findings for this workspace. Check your connection, or return to reviews and try again."
                  : "We could not load reviews for this workspace — check connectivity, then open the curated Claims Intake example if you are in demo mode."
                : buyerPolishedShell
                  ? `When reviews surface items that need attention, they will appear here. ${BUYER_GOVERNANCE_FINDINGS_EMPTY}`
                  : "When reviews produce open findings, they appear here. Start from an architecture request, finalize a manifest, then return or open findings from review detail."
            }
            actions={[
              { label: "View reviews", href: "/reviews?projectId=default", variant: "primary" },
              {
                label: buyerPolishedShell ? BUYER_GOVERNANCE_PAGE_TITLE : "Governance workflow",
                href: "/governance",
                variant: "outline",
              },
            ]}
          />
        ) : null}

        {!loading && rows.length === 0 && !buyerPolishedShell ? (
          <details className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
            <summary className="cursor-pointer text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              What findings look like
            </summary>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Each row is either a finding (explainability-backed item to inspect) or a recorded architecture decision. Both
              include severity and category where applicable, plus rationale, supporting evidence, and a recommended
              action when the analysis produced one. Items are attached to architecture reviews.
            </p>
            <ol className="mb-0 mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-400">
              <li>Create an architecture request and wait for the pipeline to complete.</li>
              <li>Finalize the review to lock the manifest and surface findings.</li>
              <li>Return here or open review detail to inspect findings.</li>
            </ol>
          </details>
        ) : null}
        <ProductConceptsGlossary className="mt-4" />
      </div>
    </>
  );
}
