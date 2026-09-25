"use client";

import type { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { RunDetailAiReadinessGateCard } from "@/components/runs/RunDetailAiReadinessGateCard";
import { BUYER_SPONSOR_BRIEFING_PACKAGE_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";

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

function readSponsorBriefingOpenFromWindowLocation(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  const param = new URLSearchParams(window.location.search).get(RUN_DETAIL_SPONSOR_BRIEFING_OPEN_PARAM);

  return param === null ? true : parseRunDetailSponsorBriefingOpenFromSearch(param);
}

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
  const pathname = usePathname() ?? "/";
  const [sponsorBriefingOpen, setSponsorBriefingOpenState] = useState(() => readSponsorBriefingOpenFromWindowLocation());
  const sponsorBriefingOpenRef = useRef(sponsorBriefingOpen);
  sponsorBriefingOpenRef.current = sponsorBriefingOpen;

  const syncSponsorBriefingOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(
        runDetailSponsorBriefingDisclosureHrefFromSearch(readWindowLocationSearch(), open, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setSponsorBriefingOpen = useCallback(
    (open: boolean) => {
      if (sponsorBriefingOpenRef.current === open) {
        return;
      }

      sponsorBriefingOpenRef.current = open;
      setSponsorBriefingOpenState(open);
      syncSponsorBriefingOpenToUrl(open);
    },
    [syncSponsorBriefingOpenToUrl],
  );

  useEffect(() => {
    const syncSponsorBriefingOpenFromUrl = (): void => {
      const nextOpen = readSponsorBriefingOpenFromWindowLocation();

      if (sponsorBriefingOpenRef.current === nextOpen) {
        return;
      }

      sponsorBriefingOpenRef.current = nextOpen;
      setSponsorBriefingOpenState(nextOpen);
    };

    syncSponsorBriefingOpenFromUrl();
    window.addEventListener("popstate", syncSponsorBriefingOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncSponsorBriefingOpenFromUrl);
    };
  }, []);

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
