"use client";

import type { ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { RunDetailAiReadinessGateCard } from "@/components/runs/RunDetailAiReadinessGateCard";
import { BUYER_SPONSOR_BRIEFING_PACKAGE_LABEL } from "@/lib/buyer/buyer-polish-copy";

import {
  EmailRunToSponsorBannerDeferred,
  PilotRoiValidationHandoffClientDeferred,
} from "./run-detail-sponsor-briefing-deferred-chunks";

import type { CareerArtifactHonestyInput } from "@/lib/career-artifact/career-artifact-honesty";
import {
  RUN_DETAIL_SPONSOR_BRIEFING_OPEN_PARAM,
  parseRunDetailSponsorBriefingOpenFromSearch,
  runDetailSponsorBriefingDisclosureHrefFromSearch,
} from "@/lib/runs/run-detail-sponsor-briefing-disclosure-url";

export type RunDetailSponsorBriefingSectionProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly curatedSampleRun: boolean;
  readonly buyerPolishedArtifactTable: boolean;
  readonly sponsorDocxAvailable: boolean;
  readonly pagePrimaryOwnedElsewhere?: boolean;
  readonly careerArtifactHonesty?: Omit<CareerArtifactHonestyInput, "artifactKind" | "runId">;
};

export function RunDetailSponsorBriefingSection(props: RunDetailSponsorBriefingSectionProps): ReactElement {
  const {
    runId,
    manifestId,
    curatedSampleRun,
    buyerPolishedArtifactTable,
    sponsorDocxAvailable,
    pagePrimaryOwnedElsewhere,
    careerArtifactHonesty,
  } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runDetailSponsorBriefingOpenParam = searchParams.get(RUN_DETAIL_SPONSOR_BRIEFING_OPEN_PARAM);
  const [sponsorBriefingOpen, setSponsorBriefingOpenState] = useState(() =>
    runDetailSponsorBriefingOpenParam === null
      ? true
      : parseRunDetailSponsorBriefingOpenFromSearch(runDetailSponsorBriefingOpenParam),
  );
  const syncSponsorBriefingOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        runDetailSponsorBriefingDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setSponsorBriefingOpen = useCallback(
    (open: boolean) => {
      setSponsorBriefingOpenState(open);
      syncSponsorBriefingOpenToUrl(open);
    },
    [syncSponsorBriefingOpenToUrl],
  );

  useEffect(() => {
    if (runDetailSponsorBriefingOpenParam === null) {
      return;
    }

    setSponsorBriefingOpenState(parseRunDetailSponsorBriefingOpenFromSearch(runDetailSponsorBriefingOpenParam));
  }, [runDetailSponsorBriefingOpenParam]);

  const deliverables = (
    <>
      <PilotRoiValidationHandoffClientDeferred runId={runId} curatedSampleRun={curatedSampleRun} className="mb-4" />
      <RunDetailAiReadinessGateCard runId={runId} manifestId={manifestId} />
      <EmailRunToSponsorBannerDeferred
        runId={runId}
        manifestId={manifestId}
        curatedSampleRun={curatedSampleRun}
        sponsorDocxAvailable={sponsorDocxAvailable}
        pagePrimaryOwnedElsewhere={pagePrimaryOwnedElsewhere}
        careerArtifactHonesty={careerArtifactHonesty}
      />
    </>
  );

  if (buyerPolishedArtifactTable) {
    return (
      <CollapsibleSection
        title={BUYER_SPONSOR_BRIEFING_PACKAGE_LABEL}
        open={sponsorBriefingOpen}
        onToggle={setSponsorBriefingOpen}
      >
        <div id="sponsor-handoff-extended" className="scroll-mt-24">
          {deliverables}
        </div>
      </CollapsibleSection>
    );
  }

  return <div id="sponsor-handoff-extended" className="scroll-mt-24">{deliverables}</div>;
}
