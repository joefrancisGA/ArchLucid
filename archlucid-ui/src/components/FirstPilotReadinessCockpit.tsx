import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { FirstPilotProofStatusStrip } from "@/components/FirstPilotProofStatusStrip";
import { FirstPilotReadinessCockpitLoadingBody } from "@/components/FirstPilotReadinessCockpitLoadingBody";
import { FirstPilotReadinessGroupTable } from "@/components/FirstPilotReadinessGroupTable";
import { FirstPilotTechnicalCommandDisclosure } from "@/components/FirstPilotTechnicalCommandDisclosure";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useAdminConfigLintSummaryQuery } from "@/hooks/use-admin-config-lint-summary-query";
import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { usePilotScorecardQuery } from "@/hooks/use-pilot-scorecard-query";
import { OperatorAiQualityProofCard } from "@/components/operator/OperatorAiQualityProofCard";
import { buildTier1InventoryExtractorCommandLines } from "@/lib/get-archlucid-cloud-package-command";
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import type { CurrentPrincipal } from "@/lib/current-principal";
import { resolveFirstPilotCommandCenterPhase } from "@/lib/first-pilot-command-center-phase";
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
  BUYER_COMMAND_CENTER_OPEN_REVIEW_LINK,
  BUYER_COMMAND_CENTER_RECOMMENDED_HEADING,
} from "@/lib/buyer/buyer-home-status-copy";
import {
  applyBuyerPolishedCommandCenterPhase,
  isBuyerShellHomePresentation,
  shellReadinessCountPhrase,
  shellReadinessStatusTagLabel,
} from "@/lib/buyer/buyer-shell-home-present";
import { mapReadinessStatusToEnterpriseKind } from "@/lib/vocabulary/first-pilot-operator-status-vocabulary";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";
import {
  buildCorePilotCommitContextFromRunItems,
  fetchTrialAnchoredCommit,
  PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT,
  type CorePilotCommitContext,
} from "@/lib/core-pilot-commit-context";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunSummary } from "@/types/authority";

const EMPTY_COMMIT_CONTEXT: CorePilotCommitContext = {
  hasCommittedManifest: false,
  committedReviewCount: 0,
  latestRunId: null,
  firstCommittedRunId: null,
  secondCommittedRunId: null,
  latestRunReadyToFinalize: false,
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
    parts.push(shellReadinessCountPhrase("ready", counts.ready));

  if (counts.attention > 0)
    parts.push(shellReadinessCountPhrase("attention", counts.attention));

  if (counts.unknown > 0)
    parts.push(shellReadinessCountPhrase("unknown", counts.unknown));

  if (counts.blocked > 0)
    parts.push(shellReadinessCountPhrase("blocked", counts.blocked));

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
      { label: shellReadinessStatusTagLabel("ready").toLowerCase(), status: "ready", count: counts.ready },
      { label: shellReadinessStatusTagLabel("attention").toLowerCase(), status: "attention", count: counts.attention },
      { label: shellReadinessStatusTagLabel("unknown").toLowerCase(), status: "unknown", count: counts.unknown },
      { label: shellReadinessStatusTagLabel("blocked").toLowerCase(), status: "blocked", count: counts.blocked },
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
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const principal: CurrentPrincipal = currentPrincipal;
  const adminConfigProbeEnabled = principal.authorityRank >= AUTHORITY_RANK.AdminAuthority;
  const healthQueryEnabled = !isAuthorityLoading;
  const configLintQueryEnabled = adminConfigProbeEnabled && !isAuthorityLoading;
  const { data: healthData, isPending: healthPending } = useHealthReadySummaryQuery({ enabled: healthQueryEnabled });
  const { data: configLintData, isPending: configLintPending } = useAdminConfigLintSummaryQuery({
    enabled: configLintQueryEnabled,
  });
  const scorecardQueryEnabled = !isAuthorityLoading;
  const runsQueryEnabled = scorecardQueryEnabled && !isPublicDemoModeEnv();
  const { data: scorecardData, isPending: scorecardPending } = usePilotScorecardQuery({
    enabled: scorecardQueryEnabled,
  });
  const { data: runsData, isPending: runsPending, isError: runsError } = useAskProjectRunsQuery("default", {
    enabled: runsQueryEnabled,
  });

  const [trialAnchoredCommit, setTrialAnchoredCommit] = useState(false);
  const [trialAnchoredResolved, setTrialAnchoredResolved] = useState(!runsQueryEnabled);

  const [pendingProbes, setPendingProbes] = useState(0);
  const [runs, setRuns] = useState<readonly RunSummary[]>([]);
  const [commitCtx, setCommitCtx] = useState<CorePilotCommitContext>(EMPTY_COMMIT_CONTEXT);

  const scorecard = scorecardData ?? null;
  const scorecardLoadFailed = scorecardQueryEnabled && !scorecardPending && scorecard === null;
  const runsLoadFailed = runsQueryEnabled && (runsError || runsData?.loadError === true);

  const healthStatus = healthData?.status ?? null;
  const healthLoadFailed = healthQueryEnabled && !healthPending && healthData === null;
  const configLint = adminConfigProbeEnabled ? (configLintData ?? null) : null;

  useEffect(() => {
    if (!runsQueryEnabled || runsPending) {
      setTrialAnchoredResolved(false);

      return;
    }

    let canceled = false;
    setTrialAnchoredResolved(false);

    void fetchTrialAnchoredCommit()
      .catch(() => false)
      .then((anchored) => {
        if (!canceled) {
          setTrialAnchoredCommit(anchored);
          setTrialAnchoredResolved(true);
        }
      });

    return () => {
      canceled = true;
    };
  }, [runsPending, runsQueryEnabled, runsData]);

  useEffect(() => {
    if (isPublicDemoModeEnv()) {
      setRuns([]);
      setCommitCtx(PUBLIC_DEMO_CORE_PILOT_COMMIT_CONTEXT);

      return;
    }

    if (!runsQueryEnabled || runsPending || !trialAnchoredResolved) {
      return;
    }

    const mergedItems = runsData?.items ?? [];
    setRuns(mergedItems);
    setCommitCtx(buildCorePilotCommitContextFromRunItems(mergedItems, trialAnchoredCommit));
  }, [
    runsData,
    runsPending,
    runsQueryEnabled,
    trialAnchoredCommit,
    trialAnchoredResolved,
  ]);

  useEffect(() => {
    const nextPendingProbes =
      (scorecardPending ? 1 : 0) + (runsQueryEnabled && (runsPending || !trialAnchoredResolved) ? 1 : 0);

    setPendingProbes(nextPendingProbes);
  }, [runsPending, runsQueryEnabled, scorecardPending, trialAnchoredResolved]);

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
      applyBuyerPolishedCommandCenterPhase(
        resolveFirstPilotCommandCenterPhase({
          signals,
          baselinesEntered,
          canExecute,
          hasBlockingRow: blocker !== null,
          deferredBuyerRequirements: readFirstPilotDeferredBuyerRequirements(),
        }),
        { baselinesEntered },
      ),
    [signals, baselinesEntered, canExecute, blocker],
  );

  const probesLoading =
    isAuthorityLoading
    || healthPending
    || (configLintQueryEnabled && configLintPending)
    || scorecardPending
    || (runsQueryEnabled && (runsPending || !trialAnchoredResolved))
    || pendingProbes > 0;
  const curatedHome = isBuyerShellHomePresentation();
  const reviewPackageHref =
    commitCtx.firstCommittedRunId !== null
      ? `/architecture/reviews/${encodeURIComponent(commitCtx.firstCommittedRunId)}`
      : commitCtx.latestRunId !== null
        ? `/architecture/reviews/${encodeURIComponent(commitCtx.latestRunId)}`
        : "/architecture/reviews";

  return (
    <OperatorHomeDisclosureSection
      title="Workspace readiness"
      titleId="first-pilot-readiness-cockpit-heading"
      sectionTestId="first-pilot-readiness-cockpit"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.workspaceReadiness}
      defaultExpanded={false}
      description="Current readiness summary: platform connectivity, authority assignment, evidence ingestion, review posture, and executive evidence bundle status."
      collapsedSummary={collapsedReadinessSummary(pendingProbes, rows)}
    >
      {probesLoading ? (
        <FirstPilotReadinessCockpitLoadingBody />
      ) : (
        <>
          <article
            className={cn("mb-4 rounded-lg border p-4", DESIGN_TOKENS.surface.card)}
            data-testid="first-pilot-command-center-phase"
            data-phase={commandCenter.phase}
          >
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {curatedHome ? BUYER_COMMAND_CENTER_RECOMMENDED_HEADING : "Recommended next step"}
            </p>
            {curatedHome ? null : (
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{commandCenter.headline}</p>
            )}
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)}>{commandCenter.summary}</p>
            <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)} data-testid="first-pilot-command-center-evidence-note">
              Buyer-facing RC requires real-mode evidence; simulator or fallback outputs stay labeled in exports and sponsor
              materials.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="primary" size="sm" asChild>
                <Link href={commandCenter.href} data-testid="first-pilot-command-center-next-action">
                  {commandCenter.cta}
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={reviewPackageHref}>{BUYER_COMMAND_CENTER_OPEN_REVIEW_LINK}</Link>
              </Button>
            </div>
            {!curatedHome
              && (commandCenter.phase === "sponsor-packet-send" || commandCenter.phase === "sponsor-packet-hold") ? (
              <div className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>
                <p className="m-0">{FIRST_PILOT_SPONSOR_PROOF_DIAGNOSTICS_LINE}</p>
                <FirstPilotTechnicalCommandDisclosure commands={[FIRST_PILOT_SPONSOR_PROOF_CLI_COMMAND]} />
              </div>
            ) : null}
          </article>

          <OperatorHomeDisclosureSection
            title="View readiness details"
            titleId="first-pilot-readiness-details-heading"
            storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.readinessDetails}
            defaultExpanded={false}
            collapsedSummary={collapsedReadinessSummary(pendingProbes, rows)}
            sectionClassName="shadow-none"
            bodyClassName="mt-0"
          >
            <ReadinessStatusCountsBar rows={rows} />

            {curatedHome ? null : (
              <div className="mb-4 mt-4">
                <FirstPilotProofStatusStrip />
              </div>
            )}

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

            {!signals.evidenceReady ? (
              <div
                className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
                data-testid="first-pilot-tier1-inventory-commands"
              >
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  Tier-1 inventory scripts (Azure, AWS, GCP) — run locally, then upload from{" "}
                  <Link href="/architecture/reviews/new" className="font-medium text-teal-800 underline dark:text-teal-300">
                    {CREATE_ARCHITECTURE_LABEL}
                  </Link>
                  .
                </p>
                <FirstPilotTechnicalCommandDisclosure commands={buildTier1InventoryExtractorCommandLines()} />
              </div>
            ) : null}

            <OperatorHomeDisclosureSection
              title="Assistant readiness diagnostics"
              titleId="first-pilot-assistant-diagnostics-heading"
              storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.assistantDiagnostics}
              defaultExpanded={false}
              collapsedSummary="AI quality proof signals for assistant readiness."
              sectionClassName="mt-4 shadow-none"
              bodyClassName="mt-0"
            >
              <OperatorAiQualityProofCard embedded />
            </OperatorHomeDisclosureSection>
          </OperatorHomeDisclosureSection>
        </>
      )}
    </OperatorHomeDisclosureSection>
  );
}
