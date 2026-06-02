"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { FirstPilotProofStatusStrip } from "@/components/FirstPilotProofStatusStrip";
import { FirstPilotReadinessCockpitLoadingBody } from "@/components/FirstPilotReadinessCockpitLoadingBody";
import { FirstPilotReadinessGroupTable } from "@/components/FirstPilotReadinessGroupTable";
import { FirstPilotTechnicalCommandDisclosure } from "@/components/FirstPilotTechnicalCommandDisclosure";
import { OperatorAiQualityProofCard } from "@/components/OperatorAiQualityProofCard";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
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
} from "@/lib/first-pilot-operating-rail-status";
import {
  mapReadinessStatusToEnterpriseKind,
  mapSponsorDispositionToEnterpriseKind,
} from "@/lib/first-pilot-operator-status-vocabulary";
import { fetchAdminConfigLintSummary } from "@/lib/fetch-admin-config-lint";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import {
  buildCorePilotCommitContextFromRunItems,
  fetchTrialAnchoredCommit,
  PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT,
  type CorePilotCommitContext,
} from "@/lib/core-pilot-commit-context";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";
import type { RunSummary } from "@/types/authority";
import { cn } from "@/lib/utils";

const EMPTY_COMMIT_CONTEXT: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
};

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

function firstBlockingRow(rows: readonly FirstPilotReadinessRow[]): FirstPilotReadinessRow | null {
  return rows.find((row) => row.status === "blocked" || row.status === "attention" || row.status === "unknown") ?? null;
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

function collapsedReadinessSummary(pendingProbes: number, rows: readonly FirstPilotReadinessRow[]): string {
  if (pendingProbes === 0) {
    return formatReadinessCountsSummary(rows);
  }

  const counts = buildReadinessStatusCounts(rows);
  const resolvedCount = counts.ready + counts.attention + counts.blocked;

  if (resolvedCount > 0) {
    return `${formatReadinessCountsSummary(rows)} · still checking…`;
  }

  return "Checking workspace readiness…";
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
        <StatusTag
          key={status}
          kind={mapReadinessStatusToEnterpriseKind(status)}
          label={`${String(count)} ${label}`}
        />
      ))}
    </div>
  );
}

/** Single first-pilot command center: phase, readiness rows, sponsor disposition, and next action in one place. */
export function FirstPilotReadinessCockpit() {
  const bootstrapPrincipal = shellBootstrapReadPrincipal;
  const adminConfigProbeEnabled = bootstrapPrincipal.authorityRank >= AUTHORITY_RANK.AdminAuthority;
  const initialPendingProbes = adminConfigProbeEnabled ? 5 : 4;

  const [pendingProbes, setPendingProbes] = useState(initialPendingProbes);
  const [principal, setPrincipal] = useState<CurrentPrincipal>(bootstrapPrincipal);
  const [runs, setRuns] = useState<readonly RunSummary[]>([]);
  const [commitCtx, setCommitCtx] = useState<CorePilotCommitContext>(EMPTY_COMMIT_CONTEXT);
  const [scorecard, setScorecard] = useState<PilotScorecardJson | null>(null);
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [healthLoadFailed, setHealthLoadFailed] = useState(false);
  const [runsLoadFailed, setRunsLoadFailed] = useState(false);
  const [scorecardLoadFailed, setScorecardLoadFailed] = useState(false);
  const [configLint, setConfigLint] = useState<Awaited<ReturnType<typeof fetchAdminConfigLintSummary>> | null>(null);

  const finishProbe = useCallback(() => {
    setPendingProbes((count) => Math.max(0, count - 1));
  }, []);

  const signals = useMemo(
    () =>
      buildFirstPilotOperatingRailSignals({
        healthStatus,
        runs,
        evidenceAcknowledged: readFirstPilotEvidenceAcknowledged(),
        hasCommittedManifest: commitCtx.hasCommittedManifest,
        latestRunId: commitCtx.latestRunId,
        firstCommittedRunId: commitCtx.firstCommittedRunId,
      }),
    [commitCtx, healthStatus, runs],
  );

  useEffect(() => {
    let cancelled = false;

    void fetchHealthReadySummary()
      .then((readyBody) => {
        if (cancelled) {
          return;
        }

        setHealthStatus(readyBody?.status ?? null);
        setHealthLoadFailed(readyBody === null);
      })
      .finally(() => {
        if (!cancelled) {
          finishProbe();
        }
      });

    void loadCurrentPrincipal()
      .then((loadedPrincipal) => {
        if (cancelled) {
          return;
        }

        setPrincipal(loadedPrincipal);
      })
      .finally(() => {
        if (!cancelled) {
          finishProbe();
        }
      });

    void getPilotScorecard()
      .then((loadedScorecard) => {
        if (cancelled) {
          return;
        }

        setScorecard(loadedScorecard);
        setScorecardLoadFailed(loadedScorecard === null);
      })
      .finally(() => {
        if (!cancelled) {
          finishProbe();
        }
      });

    void (async () => {
      try {
        const [trialAnchoredCommit, merged] = await Promise.all([
          isPublicDemoModeEnv() ? Promise.resolve(false) : fetchTrialAnchoredCommit().catch(() => false),
          loadProjectRunsMergedWithDemoFallback("default").catch(() => ({ items: [], loadError: true })),
        ]);

        if (cancelled) {
          return;
        }

        setRuns(merged.items);
        setRunsLoadFailed(merged.loadError === true);
        setCommitCtx(
          isPublicDemoModeEnv()
            ? PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT
            : buildCorePilotCommitContextFromRunItems(merged.items, trialAnchoredCommit),
        );
      } catch {
        if (!cancelled) {
          setRuns([]);
          setRunsLoadFailed(true);
          setCommitCtx(EMPTY_COMMIT_CONTEXT);
        }
      } finally {
        if (!cancelled) {
          finishProbe();
        }
      }
    })();

    if (adminConfigProbeEnabled) {
      void fetchAdminConfigLintSummary()
        .then((loadedConfigLint) => {
          if (cancelled) {
            return;
          }

          setConfigLint(loadedConfigLint);
        })
        .finally(() => {
          if (!cancelled) {
            finishProbe();
          }
        });
    }

    return () => {
      cancelled = true;
    };
  }, [adminConfigProbeEnabled, finishProbe]);

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

  const probesLoading = pendingProbes > 0;

  return (
    <OperatorHomeDisclosureSection
      title="Workspace readiness"
      titleId="first-pilot-readiness-cockpit-heading"
      sectionTestId="first-pilot-readiness-cockpit"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.workspaceReadiness}
      defaultExpanded={false}
      description="Current readiness summary: platform connectivity, authority assignment, evidence ingestion, review posture, and executive evidence package status."
      collapsedSummary={collapsedReadinessSummary(pendingProbes, rows)}
    >
      {probesLoading ? (
        <FirstPilotReadinessCockpitLoadingBody />
      ) : (
        <>
          <ReadinessStatusCountsBar rows={rows} />

      <div className="mb-4">
        <FirstPilotProofStatusStrip />
      </div>

      <article
        className={cn("mb-4 rounded-lg border p-4", DESIGN_TOKENS.surface.card)}
        data-testid="first-pilot-command-center-phase"
        data-phase={commandCenter.phase}
      >
        <p className={cn("m-0 font-semibold uppercase tracking-wide", OPERATOR_TYPOGRAPHY.label)}>Next action</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusTag
            kind="neutral"
            label={FIRST_PILOT_COMMAND_CENTER_OPERATOR_PATH_PHASE[commandCenter.phase]}
          />
          <StatusTag kind="in-progress" label={commandCenter.headline} />
          <StatusTag
            kind={mapSponsorDispositionToEnterpriseKind(commandCenter.sponsorDisposition)}
            label={sponsorDispositionLabel(commandCenter.sponsorDisposition)}
          />
        </div>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{commandCenter.summary}</p>
        <Button variant="primary" size="sm" className="mt-3" asChild>
          <Link href={commandCenter.href} data-testid="first-pilot-command-center-next-action">
            {commandCenter.cta}
          </Link>
        </Button>
        {commandCenter.phase === "sponsor-packet-send" || commandCenter.phase === "sponsor-packet-hold" ? (
          <div className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.label)}>
            <p className="m-0">{FIRST_PILOT_SPONSOR_PROOF_DIAGNOSTICS_LINE}</p>
            <FirstPilotTechnicalCommandDisclosure commands={[FIRST_PILOT_SPONSOR_PROOF_CLI_COMMAND]} />
          </div>
        ) : null}
      </article>

      <div className="space-y-5">
        {READINESS_GROUPS.map((groupDef) => (
          <FirstPilotReadinessGroupTable
            key={groupDef.group}
            group={groupDef.group}
            groupLabel={groupDef.label}
            rows={rows}
          />
        ))}
      </div>

      <OperatorHomeDisclosureSection
        title="Assistant readiness diagnostics"
        storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.assistantDiagnostics}
        defaultExpanded={false}
        collapsedSummary="AI quality proof signals for assistant readiness."
        sectionClassName="mt-4 shadow-none"
        bodyClassName="mt-0"
      >
        <OperatorAiQualityProofCard embedded />
      </OperatorHomeDisclosureSection>
        </>
      )}
    </OperatorHomeDisclosureSection>
  );
}
