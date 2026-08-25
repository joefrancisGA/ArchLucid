"use client";

import { useMemo, useState } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { WHY_ARCHLUCID_PAGE_LOAD_RETRY_LABEL } from "@/lib/why-archlucid-page-copy";
import { cn } from "@/lib/utils";
import { useWhyArchLucidPageQuery } from "@/hooks/use-why-archlucid-page-query";

import { resolveWhyArchLucidDemoUniverse } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-demo-universe";
import {
  initialWhyArchLucidPageState,
  type WhyArchLucidPageState,
} from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { WhyArchLucidBuyerChrome } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidBuyerChrome";
import { WhyArchLucidFirstValueReportSection } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidFirstValueReportSection";
import { WhyArchLucidPageFooter } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidPageFooter";
import { WhyArchLucidPageHeader } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidPageHeader";
import { WhyArchLucidPageLoadFailure } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidPageLoadFailure";
import { WhyArchLucidPageSkeleton } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidPageSkeleton";
import { WhyArchLucidPrimaryCta } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidPrimaryCta";
import { WhyArchLucidRunExplanationSection } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidRunExplanationSection";
import { WhyArchLucidSnapshotSection } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidSnapshotSection";
import { WhyArchLucidSponsorEvidencePackSection } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidSponsorEvidencePackSection";

/**
 * Read-only "Why ArchLucid" proof page (Core Pilot tier, no `requiredAuthority`).
 * Wires the seeded Retail baseline demo run to live read endpoints; chrome follows payload universe (TB-1306).
 */
export function WhyArchLucidPage(): React.JSX.Element {
  const [reloadNonce, setReloadNonce] = useState(0);
  const pageQuery = useWhyArchLucidPageQuery({ reloadNonce });
  const state: WhyArchLucidPageState = pageQuery.data ?? {
    ...initialWhyArchLucidPageState,
    loading: pageQuery.isPending,
  };

  const payloadUniverse = useMemo(() => {
    const demoRunId = state.snapshot?.demoRunId ?? state.sponsorPack?.demoRunId ?? null;
    const citationLabels = (state.explanation?.citations ?? []).map((citation) => citation.label ?? "");
    const contosoDemoWatermark = state.sponsorPack?.demoRunValueReportDelta?.isDemoTenant === true;

    return resolveWhyArchLucidDemoUniverse({
      demoRunId,
      citationLabels,
      contosoDemoWatermark,
    });
  }, [state.explanation?.citations, state.snapshot?.demoRunId, state.sponsorPack]);

  // Chrome follows the payload universe (Contoso-labeled-live Option B). Unknown fails closed after load (TB-1306).
  const failClosed = !state.loading && payloadUniverse === "unknown";
  const pageLoadFailed = !state.loading && state.snapshot === null && state.snapshotError !== null;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <OperatorPageContainer
      variant="workflow"
      className={cn("p-4", OPERATOR_LAYOUT.sectionStack)}
      data-testid="why-archlucid-page"
      aria-busy={state.loading}
    >
      <WhyArchLucidPageHeader
        universe={payloadUniverse}
        failClosed={failClosed}
        buyerPolishedShell={buyerPolishedShell}
      />

      {state.loading ? <WhyArchLucidPageSkeleton /> : null}

      {!state.loading ? <WhyArchLucidBuyerChrome /> : null}

      {!state.loading && pageLoadFailed && state.snapshotError !== null ? (
        <WhyArchLucidPageLoadFailure
          error={state.snapshotError}
          retryLabel={WHY_ARCHLUCID_PAGE_LOAD_RETRY_LABEL}
          retryDisabled={state.loading}
          onRetry={() => {
            setReloadNonce((previous) => previous + 1);
          }}
        />
      ) : null}

      {!state.loading && !pageLoadFailed ? (
        <>
          <WhyArchLucidPrimaryCta
            demoRunId={state.snapshot?.demoRunId}
            loading={state.loading}
            failClosed={failClosed}
          />
          <WhyArchLucidSnapshotSection state={state} />
          <WhyArchLucidSponsorEvidencePackSection state={state} universe={payloadUniverse} />
          <WhyArchLucidFirstValueReportSection state={state} universe={payloadUniverse} />
          <WhyArchLucidRunExplanationSection state={state} />

          <WhyArchLucidPageFooter />
        </>
      ) : null}
    </OperatorPageContainer>
  );
}
