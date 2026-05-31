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
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

type Phase = "loading" | "ready";

function statusClass(status: FirstPilotReadinessStatus): string {
  switch (status) {
    case "ready":
      return "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200";
    case "attention":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    case "blocked":
      return "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100";
    case "unknown":
      return "border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300";
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
      return "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100";
    case "hold":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    case "readiness-only":
      return "border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-200";
    case "deferred":
      return "border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-100";
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
      collapsedSummary="Platform connectivity, authority, evidence, review posture, and executive evidence package."
    >
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <article key={row.id} className={`rounded-lg border p-3 ${statusClass(row.status)}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-current/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                {statusLabel(row.status)}
              </span>
              <h3 className="m-0 text-sm font-semibold">{row.label}</h3>
            </div>
            <p className="m-0 mt-2 text-xs leading-relaxed">{row.summary}</p>
            <Link href={row.href} className="mt-2 inline-block text-xs font-medium underline underline-offset-2">
              {row.cta}
            </Link>
          </article>
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
