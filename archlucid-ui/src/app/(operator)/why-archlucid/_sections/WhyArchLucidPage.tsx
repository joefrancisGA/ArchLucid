"use client";

import { useEffect, useState } from "react";

import {
  getFirstValueReportMarkdown,
  getRunExplanationSummary,
  getSponsorEvidencePack,
  getTenantMeasuredRoi,
  type WhyArchLucidSnapshot,
} from "@/lib/api";
import { toSectionError } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-helpers";
import {
  initialWhyArchLucidPageState,
  type SectionError,
  type WhyArchLucidPageState,
} from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { WhyArchLucidFirstValueReportSection } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidFirstValueReportSection";
import { WhyArchLucidMeasuredContextSection } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidMeasuredContextSection";
import { WhyArchLucidPageFooter } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidPageFooter";
import { WhyArchLucidPageHeader } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidPageHeader";
import { WhyArchLucidRunExplanationSection } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidRunExplanationSection";
import { WhyArchLucidSnapshotSection } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidSnapshotSection";
import { WhyArchLucidSponsorEvidencePackSection } from "@/app/(operator)/why-archlucid/_sections/WhyArchLucidSponsorEvidencePackSection";

/**
 * Read-only "Why ArchLucid" proof page (Core Pilot tier, no `requiredAuthority`).
 * Wires the seeded Contoso Retail demo run to live read endpoints.
 */
export function WhyArchLucidPage() {
  const [state, setState] = useState<WhyArchLucidPageState>(initialWhyArchLucidPageState);

  useEffect(() => {
    let cancelled = false;

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

      if (cancelled) return;

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

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="mx-auto max-w-4xl space-y-8 p-4"
      data-testid="why-archlucid-page"
      aria-busy={state.loading}
    >
      <WhyArchLucidPageHeader />

      <WhyArchLucidSnapshotSection state={state} />
      <WhyArchLucidSponsorEvidencePackSection state={state} />
      <WhyArchLucidMeasuredContextSection state={state} />
      <WhyArchLucidFirstValueReportSection state={state} />
      <WhyArchLucidRunExplanationSection state={state} />

      <WhyArchLucidPageFooter demoRunId={state.snapshot?.demoRunId} />
    </div>
  );
}
