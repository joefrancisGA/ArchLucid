"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { FirstPilotProofStatusStrip } from "@/components/FirstPilotProofStatusStrip";
import { FirstPilotTechnicalCommandDisclosure } from "@/components/FirstPilotTechnicalCommandDisclosure";
import { OperatorAiQualityProofCard } from "@/components/OperatorAiQualityProofCard";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { getPilotScorecard } from "@/lib/api";
import { loadCurrentPrincipal, shellBootstrapReadPrincipal, type CurrentPrincipal } from "@/lib/current-principal";
import {
  FIRST_PILOT_COMMAND_CENTER_OPERATOR_PATH_PHASE,
  resolveFirstPilotCommandCenterPhase,
  type FirstPilotCommandCenterPhaseSummary,
} from "@/lib/first-pilot-command-center-phase";
import {
  FIRST_PILOT_SPONSOR_PROOF_CLI_COMMAND,
  FIRST_PILOT_SPONSOR_PROOF_DIAGNOSTICS_LINE,
} from "@/lib/first-pilot-diagnostics-copy";
import {
  buildFirstPilotReadinessRows,
  type FirstPilotReadinessGroup,
  type FirstPilotReadinessRow,
  type FirstPilotReadinessStatus,
} from "@/lib/first-pilot-readiness-cockpit";
import {
  buildFirstPilotOperatingRailSignals,
  readFirstPilotDeferredBuyerRequirements,
  readFirstPilotEvidenceAcknowledged,
  type FirstPilotOperatingRailSignals,
} from "@/lib/first-pilot-operating-rail-status";
import { mapReadinessStatusToOperatorLabel } from "@/lib/first-pilot-operator-status-vocabulary";
import { fetchAdminConfigLintSummary } from "@/lib/fetch-admin-config-lint";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { operatorSemanticBadge, operatorSemanticSurface } from "@/lib/design-tokens";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

type Phase = "loading" | "ready";

type ReadinessStatusCounts = {
  ready: number;
  attention: number;
  unknown: number;
  blocked: number;
};

type ReadinessGroupDefinition = {
  group: FirstPilotReadinessGroup;
  label: string;
};

const READINESS_GROUPS: readonly ReadinessGroupDefinition[] = [
  { group: "platform", label: "Platform readiness" },
  { group: "execution", label: "Review execution" },
  { group: "evidence", label: "Business evidence" },
  { group: "followup", label: "Follow-up" },
];

function statusClass(status: FirstPilotReadinessStatus): string {
  switch (status) {
    case "ready":
      return operatorSemanticBadge("ready");

    case "attention":
      return operatorSemanticBadge("warn");

    case "blocked":
      return operatorSemanticBadge("blocked");

    case "unknown":
      return operatorSemanticBadge("neutral");

    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

function statusLabel(status: FirstPilotReadinessStatus): string {
  return mapReadinessStatusToOperatorLabel(status);
}

function firstBlockingRow(rows: readonly FirstPilotReadinessRow[]): FirstPilotReadinessRow | null {
  return rows.find((row) => row.status === "blocked" || row.status === "attention" || row.status === "unknown") ?? null;
}

function sponsorDispositionClass(disposition: FirstPilotCommandCenterPhaseSummary["sponsorDisposition"]): string {
  switch (disposition) {
    case "send":
      return operatorSemanticSurface("ready");

    case "hold":
      return operatorSemanticSurface("warn");

    case "readiness-only":
    case "deferred":
      return operatorSemanticSurface("neutral");

    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}

function sponsorDispositionLabel(disposition: FirstPilotCommandCenterPhaseSummary["sponsorDisposition"]): string {
  switch (disposition) {
    case "send":
      return "Sponsor send";
    case "hold":
      return "Sponsor hold";
    case "readiness-only":
      return "Readiness only";
    case "deferred":
      return "Deferred scope";
    default: {
      const exhaustive: never = disposition;

      return exhaustive;
    }
  }
}

function buildReadinessStatusCounts(rows: readonly FirstPilotReadinessRow[]): ReadinessStatusCounts {
  return rows.reduce<ReadinessStatusCounts>(
    (acc, row) => {
      acc[row.status] += 1;

      return acc;
    },
    { ready: 0, attention: 0, unknown: 0, blocked: 0 },
  );
}

function formatReadinessCountsSummary(rows: readonly FirstPilotReadinessRow[]): string {
  const counts = buildReadinessStatusCounts(rows);
  const parts: string[] = [];

  if (counts.ready > 0)
    parts.push(`${String(counts.ready)} ready`);

  if (counts.attention > 0)
    parts.push(`${String(counts.attention)} needs attention`);

  if (counts.unknown > 0)
    parts.push(`${String(counts.unknown)} pending`);

  if (counts.blocked > 0)
    parts.push(`${String(counts.blocked)} blocked`);

  return parts.join(" · ") || "Workspace readiness loading…";
}

function ReadinessCard({ row }: { readonly row: FirstPilotReadinessRow }): React.JSX.Element {
  return (
    <article className={`rounded-lg border p-3 ${statusClass(row.status)}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {statusLabel(row.status)}
        </span>
        <h4 className="m-0 text-sm font-semibold">{row.label}</h4>
      </div>
      <p className="m-0 mt-2 text-xs leading-relaxed">{row.summary}</p>
      <Link href={row.href} className="mt-2 inline-block text-xs font-medium underline underline-offset-2">
        {row.cta}
      </Link>
    </article>
  );
}

function ReadinessStatusCountsBar({ rows }: { readonly rows: readonly FirstPilotReadinessRow[] }): React.JSX.Element | null {
  const counts = buildReadinessStatusCounts(rows);

  type CountPart = { label: string; status: FirstPilotReadinessStatus; count: number };

  const parts: CountPart[] = (
    [
      { label: "ready", status: "ready", count: counts.ready },
      { label: "needs attention", status: "attention", count: counts.attention },
      { label: "pending", status: "unknown", count: counts.unknown },
      { label: "blocked", status: "blocked", count: counts.blocked },
    ] satisfies CountPart[]
  ).filter((p) => p.count > 0);

  if (parts.length === 0)
    return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Readiness summary">
      {parts.map(({ label, status, count }) => (
        <span
          key={status}
          className={`rounded-full border border-current/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass(status)}`}
        >
          {String(count)} {label}
        </span>
      ))}
    </div>
  );
}

function ReadinessGroupSection({ groupDef, rows }: {
  readonly groupDef: ReadinessGroupDefinition;
  readonly rows: readonly FirstPilotReadinessRow[];
}): React.JSX.Element | null {
  const groupRows = rows.filter((row) => row.group === groupDef.group);

  if (groupRows.length === 0)
    return null;

  return (
    <section aria-labelledby={`readiness-group-${groupDef.group}`}>
      <h3
        id={`readiness-group-${groupDef.group}`}
        className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
      >
        {groupDef.label}
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groupRows.map((row) => (
          <ReadinessCard key={row.id} row={row} />
        ))}
      </div>
    </section>
  );
}

/** Single first-pilot command center: phase, readiness rows, sponsor disposition, and next action in one place. */
export function FirstPilotReadinessCockpit() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [principal, setPrincipal] = useState<CurrentPrincipal>(shellBootstrapReadPrincipal);
  const [signals, setSignals] = useState<FirstPilotOperatingRailSignals>(() =>
    buildFirstPilotOperatingRailSignals({
      healthStatus: null,
      runs: [],
      evidenceAcknowledged: false,
      hasCommittedManifest: false,
      latestRunId: null,
      firstCommittedRunId: null,
    }),
  );
  const [scorecard, setScorecard] = useState<PilotScorecardJson | null>(null);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthLoadFailed, setHealthLoadFailed] = useState(false);
  const [runsLoadFailed, setRunsLoadFailed] = useState(false);
  const [scorecardLoadFailed, setScorecardLoadFailed] = useState(false);
  const [configLint, setConfigLint] = useState<Awaited<ReturnType<typeof fetchAdminConfigLintSummary>> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setPhase("loading");

      const [readyBody, merged, ctx, loadedPrincipal, loadedScorecard] = await Promise.all([
        fetchHealthReadySummary().catch(() => null),
        loadProjectRunsMergedWithDemoFallback("default").catch(() => ({ items: [], loadError: true })),
        fetchCorePilotCommitContext().catch(() => ({
          hasCommittedManifest: false,
          latestRunId: null,
          firstCommittedRunId: null,
        })),
        loadCurrentPrincipal().catch(() => shellBootstrapReadPrincipal),
        getPilotScorecard().catch(() => null),
      ]);

      const canAdmin = loadedPrincipal.authorityRank >= AUTHORITY_RANK.AdminAuthority;
      const loadedConfigLint = canAdmin ? await fetchAdminConfigLintSummary().catch(() => null) : null;

      if (cancelled)
        return;

      const nextHealthStatus = readyBody?.status ?? null;
      setHealthStatus(nextHealthStatus);
      setHealthLoadFailed(readyBody === null);
      setRunsLoadFailed(merged.loadError === true);
      setPrincipal(loadedPrincipal);
      setScorecard(loadedScorecard);
      setScorecardLoadFailed(loadedScorecard === null);
      setConfigLint(loadedConfigLint);
      setSignals(
        buildFirstPilotOperatingRailSignals({
          healthStatus: nextHealthStatus,
          runs: merged.items,
          evidenceAcknowledged: readFirstPilotEvidenceAcknowledged(),
          hasCommittedManifest: ctx.hasCommittedManifest,
          latestRunId: ctx.latestRunId,
          firstCommittedRunId: ctx.firstCommittedRunId,
        }),
      );
      setPhase("ready");
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () =>
      buildFirstPilotReadinessRows({
        healthStatus,
        healthLoadFailed,
        runsLoadFailed,
        principal,
        signals,
        scorecard,
        scorecardLoadFailed,
        configLint,
      }),
    [healthStatus, healthLoadFailed, runsLoadFailed, principal, signals, scorecard, scorecardLoadFailed, configLint],
  );
  const blocker = firstBlockingRow(rows);
  const canExecute = principal.authorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const baselinesEntered =
    scorecard?.baselines?.baselineHoursPerReview !== null
    && scorecard?.baselines?.baselineHoursPerReview !== undefined
    && scorecard?.baselines?.baselineReviewsPerQuarter !== null
    && scorecard?.baselines?.baselineReviewsPerQuarter !== undefined
    && scorecard?.baselines?.baselineArchitectHourlyCost !== null
    && scorecard?.baselines?.baselineArchitectHourlyCost !== undefined;
  const commandCenter = useMemo(
    () =>
      resolveFirstPilotCommandCenterPhase({
        signals,
        baselinesEntered,
        canExecute,
        hasBlockingRow: blocker !== null,
        deferredBuyerRequirements: readFirstPilotDeferredBuyerRequirements(),
      }),
    [signals, baselinesEntered, canExecute, blocker],
  );

  const collapsedSummary = phase === "loading"
    ? "Loading workspace readiness…"
    : formatReadinessCountsSummary(rows);

  if (phase === "loading") {
    return (
      <div
        className="min-h-[9rem] rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
        aria-hidden
        data-testid="first-pilot-readiness-cockpit-loading"
      />
    );
  }

  return (
    <OperatorHomeDisclosureSection
      title="Workspace readiness"
      titleId="first-pilot-readiness-cockpit-heading"
      sectionTestId="first-pilot-readiness-cockpit"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.workspaceReadiness}
      defaultExpanded={true}
      description="Current readiness summary: platform connectivity, authority assignment, evidence ingestion, review posture, and executive evidence package status."
      collapsedSummary={collapsedSummary}
    >
      <ReadinessStatusCountsBar rows={rows} />

      <div className="mb-4">
        <FirstPilotProofStatusStrip />
      </div>

      <article
        className={`mb-4 rounded-lg border p-3 ${sponsorDispositionClass(commandCenter.sponsorDisposition)}`}
        data-testid="first-pilot-command-center-phase"
        data-phase={commandCenter.phase}
      >
        <p className="m-0 text-[10px] font-semibold uppercase tracking-wide opacity-80">NEXT ACTION</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {FIRST_PILOT_COMMAND_CENTER_OPERATOR_PATH_PHASE[commandCenter.phase]}
          </span>
          <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {commandCenter.headline}
          </span>
          <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {sponsorDispositionLabel(commandCenter.sponsorDisposition)}
          </span>
        </div>
        <p className="m-0 mt-2 text-sm leading-relaxed">{commandCenter.summary}</p>
        <Link
          href={commandCenter.href}
          className="mt-3 inline-flex rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white no-underline hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          data-testid="first-pilot-command-center-next-action"
        >
          {commandCenter.cta}
        </Link>
        {commandCenter.phase === "sponsor-packet-send" || commandCenter.phase === "sponsor-packet-hold" ? (
          <div className="m-0 mt-2 text-xs leading-relaxed opacity-90">
            <p className="m-0">{FIRST_PILOT_SPONSOR_PROOF_DIAGNOSTICS_LINE}</p>
            <FirstPilotTechnicalCommandDisclosure commands={[FIRST_PILOT_SPONSOR_PROOF_CLI_COMMAND]} />
          </div>
        ) : null}
      </article>

      <div className="space-y-5">
        {READINESS_GROUPS.map((groupDef) => (
          <ReadinessGroupSection key={groupDef.group} groupDef={groupDef} rows={rows} />
        ))}
      </div>

      <OperatorHomeDisclosureSection
        title="Assistant readiness diagnostics"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.assistantDiagnostics}
        defaultExpanded={false}
        collapsedSummary="AI quality proof signals for assistant readiness."
        sectionClassName="mt-4 border-neutral-200 bg-neutral-50/80 shadow-none dark:border-neutral-700 dark:bg-neutral-900/40"
        bodyClassName="mt-0"
      >
        <OperatorAiQualityProofCard embedded />
      </OperatorHomeDisclosureSection>
    </OperatorHomeDisclosureSection>
  );
}
