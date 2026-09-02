"use client";

import { useMemo } from "react";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  deriveSponsorSynopsisCounts,
  deriveSponsorSynopsisPackageTitle,
  resolveGovernanceFindingsSponsorHandoffHref,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";

export type UseGovernanceFindingsSponsorSynopsisInput = {
  readonly displayedRows: readonly GovernanceFindingQueueRow[];
  readonly scopedRunId: string | null;
};

export function useGovernanceFindingsSponsorSynopsis(input: UseGovernanceFindingsSponsorSynopsisInput) {
  const { displayedRows, scopedRunId } = input;

  const sponsorSynopsisPackageTitle = deriveSponsorSynopsisPackageTitle(displayedRows, scopedRunId);
  const sponsorSynopsisCounts = useMemo(
    () => deriveSponsorSynopsisCounts(displayedRows),
    [displayedRows],
  );
  const sponsorHandoffHref = resolveGovernanceFindingsSponsorHandoffHref(scopedRunId);

  return {
    sponsorSynopsisPackageTitle,
    sponsorSynopsisCounts,
    sponsorHandoffHref,
  };
}

export type GovernanceFindingsSponsorSynopsisState = ReturnType<typeof useGovernanceFindingsSponsorSynopsis>;
