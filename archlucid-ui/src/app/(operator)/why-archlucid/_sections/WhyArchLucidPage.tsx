"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { WHY_ARCHLUCID_PAGE_LOAD_RETRY_LABEL } from "@/lib/why-archlucid-page-copy";

import {
  getFirstValueReportMarkdown,
  getRunExplanationSummary,
  getSponsorEvidencePack,
  getTenantMeasuredRoi,
  type WhyArchLucidSnapshot,
} from "@/lib/api";
import { resolveWhyArchLucidDemoUniverse } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-demo-universe";
import { toSectionError } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-helpers";
import {
  initialWhyArchLucidPageState,
  type SectionError,
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
export function WhyArchLucidPage() {
  const [state, setState] = useState<WhyArchLucidPageState>(initialWhyArchLucidPageState);
  const [reloadNonce, setReloadNonce] = useState(0);

  useEffect(() => {
    let canceled = false;

    async function loadAll(): Promise<void> {
      let snapshot: WhyArchLucidSnapshot | null = null;
      let snapshotError: SectionError | null = null;
      let monthlyCostEstimate: WhyArchLucidPageState["monthlyCostEstimate"] = null;
      let measuredDisclaimer: string | null = null;
      let sponsorPack: WhyArchLucidPageState["sponsorPack"] = null;
      let sponsorPackError: SectionError | null = null;

      const [bundleOutcome, sponsorOutcome] = await Promise.allSettled([getTenantMeasuredRoi(), getSponsorEvidencePack()]);

      if (bundleOutcome.status === "fulfilled") {
        snapshot = bundleOutcome.value.snapshot;
        monthlyCostEstimate = bundleOutcome.value.monthlyCostEstimate;
        measuredDisclaimer = bundleOutcome.value.disclaimer;
      }

      if (bundleOutcome.status === "rejected") {
        snapshotError = toSectionError(bundleOutcome.reason, "Could not load measured ROI / telemetry bundle.");
      }

      if (sponsorOutcome.status === "fulfilled") sponsorPack = sponsorOutcome.value;

      if (sponsorOutcome.status === "rejected") {
        sponsorPackError = toSectionError(sponsorOutcome.reason, "Could not load the sponsor evidence pack bundle.");
      }

      const runId = snapshot?.demoRunId?.trim() ?? "";

      let reportMarkdown: string | null = null;
      let reportMissing = false;
      let reportError: SectionError | null = null;
      let explanation: WhyArchLucidPageState["explanation"] = null;
      let explanationError: SectionError | null = null;

      if (runId.length > 0) {
        const [reportResult, explanationResult] = await Promise.allSettled([
          getFirstValueReportMarkdown(runId),
          getRunExplanationSummary(runId),
        ]);

        if (reportResult.status === "fulfilled") {
          if (reportResult.value === null) reportMissing = true;
          else reportMarkdown = reportResult.value;
        } else {
          reportError = toSectionError(reportResult.reason, "Could not load the first-value report.");
        }

        if (explanationResult.status === "fulfilled") {
          explanation = explanationResult.value;
        } else {
          explanationError = toSectionError(explanationResult.reason, "Could not load the architecture review explanation.");
        }
      }

      if (canceled) return;

      setState({
        snapshot,
        snapshotError,
        monthlyCostEstimate,
        measuredDisclaimer,
        reportMarkdown,
        reportMissing,
        reportError,
        explanation,
        explanationError,
        sponsorPack,
        sponsorPackError,
        loading: false,
      });
    }

    setState((previous) => ({ ...previous, loading: true }));
    void loadAll();

    return () => {
      canceled = true;
    };
  }, [reloadNonce]);

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
    <div
      className={cn("w-full max-w-[1200px] p-4", OPERATOR_LAYOUT.sectionStack)}
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
    </div>
  );
}
