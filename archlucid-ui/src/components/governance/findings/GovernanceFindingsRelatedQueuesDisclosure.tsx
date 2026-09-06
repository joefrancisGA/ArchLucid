"use client";

import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AlertsFindingsVocabularyRail } from "@/components/AlertsFindingsVocabularyRail";
import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import { FindingsQueueSearchEvidenceVocabularyRail } from "@/components/findings/FindingsQueueSearchEvidenceVocabularyRail";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { RiskExceptionsFindingsVocabularyRail } from "@/components/RiskExceptionsFindingsVocabularyRail";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import type { GovernanceJobId } from "@/lib/governance/governance-job-router";
import {
  governanceFindingsRelatedQueuesHrefFromSearch,
  parseGovernanceFindingsRelatedQueuesOpenFromSearch,
} from "@/lib/governance/governance-findings-related-queues-url";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const governanceFindingsRelatedQueuesOpenParam = searchParams.get("governanceFindingsRelatedQueuesOpen");
  const [open, setOpenState] = useState(() =>
    parseGovernanceFindingsRelatedQueuesOpenFromSearch(governanceFindingsRelatedQueuesOpenParam),
  );

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(
        governanceFindingsRelatedQueuesHrefFromSearch(searchParams.toString(), detailsOpen, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseGovernanceFindingsRelatedQueuesOpenFromSearch(governanceFindingsRelatedQueuesOpenParam));
  }, [governanceFindingsRelatedQueuesOpenParam]);

  return (
    <details
      className={cn(
        "mb-4 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      data-testid="governance-findings-related-queues-disclosure"
      open={open}
      onToggle={(event) => {
        setOpen((event.currentTarget as HTMLDetailsElement).open);
      }}
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
