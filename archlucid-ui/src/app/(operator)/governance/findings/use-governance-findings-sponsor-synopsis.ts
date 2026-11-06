"use client";

import { useMemo } from "react";

import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import {
  deriveSponsorSynopsisCounts,
  deriveSponsorSynopsisPackageTitle,
  resolveGovernanceFindingsSponsorHandoffHref,
} from "@/app/(operator)/governance/findings/governance-findings-queue-presentation";
import type { ArchitectureDraftRegistryEntry } from "@/lib/architecture/architecture-draft-registry";

export type UseGovernanceFindingsSponsorSynopsisInput = {
  readonly displayedRows: readonly GovernanceFindingQueueRow[];
  readonly scopedRunId: string | null;
  readonly pathname?: string | null;
  readonly scopedArchitectureId?: string | null;
  readonly draftRegistryEntries?: readonly ArchitectureDraftRegistryEntry[];
};

export function useGovernanceFindingsSponsorSynopsis(input: UseGovernanceFindingsSponsorSynopsisInput) {
  const { displayedRows, scopedRunId, pathname, scopedArchitectureId, draftRegistryEntries } = input;

  const sponsorSynopsisPackageTitle = deriveSponsorSynopsisPackageTitle(displayedRows, scopedRunId);
  const sponsorSynopsisCounts = useMemo(
    () => deriveSponsorSynopsisCounts(displayedRows),
    [displayedRows],
  );
  const sponsorHandoffHref = resolveGovernanceFindingsSponsorHandoffHref(scopedRunId, {
    pathname,
    scopedArchitectureId,
    draftRegistryEntries,
  });

  return {
    sponsorSynopsisPackageTitle,
    sponsorSynopsisCounts,
    sponsorHandoffHref,
  };
}

export type GovernanceFindingsSponsorSynopsisState = ReturnType<typeof useGovernanceFindingsSponsorSynopsis>;
