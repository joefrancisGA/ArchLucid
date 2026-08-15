"use client";

import type { JSX } from "react";

import { AlertsFindingsVocabularyRail } from "@/components/AlertsFindingsVocabularyRail";
import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/findings/FindingsQueueSearchEvidenceVocabularyRail";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { RiskExceptionsFindingsVocabularyRail } from "@/components/RiskExceptionsFindingsVocabularyRail";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import type { GovernanceJobId } from "@/lib/governance/governance-job-router";
import type { PageCapabilityBoundarySurfaceId } from "@/lib/page-capability-boundary";
import { cn } from "@/lib/utils";

export type GovernanceFindingsRelatedQueuesDisclosureProps = {
  readonly capabilitySurfaceId: PageCapabilityBoundarySurfaceId;
  readonly className?: string;
  readonly jobRouterCurrentJobId?: GovernanceJobId;
};

/** Collapses vocabulary rails and capability boundary above the findings work object (GOF P0-6). */
export function GovernanceFindingsRelatedQueuesDisclosure(
  props: GovernanceFindingsRelatedQueuesDisclosureProps,
): JSX.Element {
  return (
    <details
      className={cn(
        "mb-4 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      data-testid="governance-findings-related-queues-disclosure"
    >
      <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
        <span className={OPERATOR_TYPOGRAPHY.helper}>Related queues</span>
      </summary>
      <div className="mt-3 space-y-2">
        {props.jobRouterCurrentJobId !== undefined ? (
          <GovernanceJobRouterStrip currentJobId={props.jobRouterCurrentJobId} layout="compact" />
        ) : null}
        <AlertsFindingsVocabularyRail currentSurfaceId="findings-queue" />
        <DecisionRegisterFindingsVocabularyRail currentSurfaceId="findings-queue" />
        <RiskExceptionsFindingsVocabularyRail currentSurfaceId="findings-queue" />
        <FindingsQueueSearchEvidenceVocabularyRail currentSurfaceId="findings-queue" />
        <PageCapabilityBoundaryStrip surfaceId={props.capabilitySurfaceId} className="mb-0" />
      </div>
    </details>
  );
}
