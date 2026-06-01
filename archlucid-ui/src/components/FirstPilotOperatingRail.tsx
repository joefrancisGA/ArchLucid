"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { OperatorHomeGuidanceLink } from "@/components/operator-home/OperatorHomeGuidanceLink";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { recordCorePilotRailChecklistStep } from "@/lib/core-pilot-rail-telemetry";
import {
  buildFirstPilotOperatingRailSignals,
  readFirstPilotEvidenceAcknowledged,
  resolveFirstPilotOperatingRailSteps,
  writeFirstPilotEvidenceAcknowledged,
} from "@/lib/first-pilot-operating-rail-status";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  resolveFirstPilotOperatingRailShellCopy,
  resolveFirstPilotOperatingRailStepsForDisplay,
} from "@/lib/first-pilot-operating-rail-copy";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator-home-disclosure-storage";
import { loadProjectRunsMergedWithDemoFallback } from "@/lib/operator-run-picker-client";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  mapOperatingRailStepToEnterpriseKind,
  mapOperatingRailStepToStatusTagLabel,
} from "@/lib/first-pilot-operator-status-vocabulary";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const RAIL_LEGACY_MINIMIZED_STORAGE_KEY = "archlucid_first_pilot_operating_rail_minimized_v1";

type LoadPhase = "loading" | "ready";

/**
 * Single first-pilot operating rail: six visible steps from setup verification through sponsor packet.
 * Operate surfaces stay out of the required path until after finalize (see layer-guidance deferral notes).
 */
export function FirstPilotOperatingRail() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [phase, setPhase] = useState<LoadPhase>("loading");
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [runs, setRuns] = useState<Awaited<ReturnType<typeof loadProjectRunsMergedWithDemoFallback>>["items"]>([]);
  const [commitCtx, setCommitCtx] = useState({
    hasCommittedManifest: false,
    latestRunId: null as string | null,
    firstCommittedRunId: null as string | null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setPhase("loading");

      const [readyBody, merged, ctx] = await Promise.all([
        fetchHealthReadySummary().catch(() => null),
        loadProjectRunsMergedWithDemoFallback("default").catch(() => ({ items: [] })),
        fetchCorePilotCommitContext().catch(() => ({
          hasCommittedManifest: false,
          latestRunId: null,
          firstCommittedRunId: null,
        })),
      ]);

      if (cancelled) {
        return;
      }

      setHealthStatus(readyBody?.status ?? null);
      setRuns(merged.items);
      setCommitCtx(ctx);
      setPhase("ready");
    }

    void load();

    return () => {
      cancelled = true;
    };
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
    [healthStatus, runs, commitCtx],
  );

  const resolved = useMemo(() => resolveFirstPilotOperatingRailSteps(signals), [signals]);

  const shellCopy = useMemo(
    () => resolveFirstPilotOperatingRailShellCopy(buyerPolishedShell),
    [buyerPolishedShell],
  );
  const displaySteps = useMemo(
    () => resolveFirstPilotOperatingRailStepsForDisplay(buyerPolishedShell),
    [buyerPolishedShell],
  );

  const allComplete = resolved.every((r) => r.status === "complete");

  useEffect(() => {
    if (phase !== "ready") {
      return;
    }

    resolved.forEach((step, index) => {
      if (step.status === "complete") {
        recordCorePilotRailChecklistStep(index);
      }
    });
  }, [phase, resolved]);

  if (phase === "loading") {
    return (
      <div
        className="min-h-[4.5rem] rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
        aria-hidden
        data-testid="first-pilot-operating-rail-loading"
      />
    );
  }

  return (
    <OperatorHomeDisclosureSection
      title={shellCopy.heading}
      titleId="first-pilot-operating-rail-heading"
      sectionTestId="first-pilot-operating-rail"
      storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.operatingRail}
      legacyStorageKeys={[RAIL_LEGACY_MINIMIZED_STORAGE_KEY]}
      defaultExpanded={buyerPolishedShell}
      description={shellCopy.intro}
      collapsedSummary="Six-step path from platform setup to a finalized review package."
      headerAside={
        shellCopy.showHeaderHelpLink ? (
          <OperatorHomeGuidanceLink helpSlug={shellCopy.headerHelpSlug} label={shellCopy.headerHelpLabel} />
        ) : null
      }
      sectionDataAttributes={{ "data-rail-variant": buyerPolishedShell ? "buyer" : "operator" }}
    >
      <ol className="m-0 list-none space-y-3 p-0">
        {displaySteps.map((step, index) => {
          const { status, primaryHref } = resolved[index];

          return (
            <li
              key={step.id}
              className={cn(
                "px-3 py-2.5",
                DESIGN_TOKENS.surface.card,
                status === "current" ? "border-l-4 border-l-[var(--al-accent-interactive)]" : "",
              )}
              data-testid={`first-pilot-rail-step-${step.id}`}
              aria-current={status === "current" ? "step" : undefined}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("tabular-nums uppercase tracking-wide", OPERATOR_TYPOGRAPHY.label)}>
                  Step {index + 1}
                </span>
                <StatusTag
                  kind={mapOperatingRailStepToEnterpriseKind(status)}
                  label={mapOperatingRailStepToStatusTagLabel(status)}
                />
              </div>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.cardTitle)}>{step.title}</p>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>{step.shortBody}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={primaryHref}>{step.primaryLabel}</Link>
                </Button>
                {step.id === "ingest-evidence" && status !== "complete" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      writeFirstPilotEvidenceAcknowledged();
                      window.location.assign(`/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`);
                    }}
                  >
                    Use sample package instead
                  </Button>
                ) : null}
                {shellCopy.showStepTroubleshootLinks && (status === "attention" || status === "current") ? (
                  <OperatorHomeGuidanceLink
                    helpSlug={step.troubleshootHelpSlug}
                    label={`Troubleshoot — ${step.title}`}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      {allComplete ? (
        <p className={cn("m-0 mt-4", OPERATOR_TYPOGRAPHY.body)}>{shellCopy.completeMessage}</p>
      ) : null}
    </OperatorHomeDisclosureSection>
  );
}
