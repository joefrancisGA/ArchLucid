"use client";

import {
  getFirstValueReportMarkdown,
  getRunExplanationSummary,
  getSponsorEvidencePack,
  getTenantMeasuredRoi,
  type WhyArchLucidSnapshot,
} from "@/lib/api";
import {
  initialWhyArchLucidPageState,
  type SectionError,
  type WhyArchLucidPageState,
} from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-state";
import { toSectionError } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-helpers";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

async function fetchWhyArchLucidPageBundle(): Promise<WhyArchLucidPageState> {
  let snapshot: WhyArchLucidSnapshot | null = null;
  let snapshotError: SectionError | null = null;
  let monthlyCostEstimate: WhyArchLucidPageState["monthlyCostEstimate"] = null;
  let measuredDisclaimer: string | null = null;
  let sponsorPack: WhyArchLucidPageState["sponsorPack"] = null;
  let sponsorPackError: SectionError | null = null;

  const [bundleOutcome, sponsorOutcome] = await Promise.allSettled([
    getTenantMeasuredRoi(),
    getSponsorEvidencePack(),
  ]);

  if (bundleOutcome.status === "fulfilled") {
    snapshot = bundleOutcome.value.snapshot;
    monthlyCostEstimate = bundleOutcome.value.monthlyCostEstimate;
    measuredDisclaimer = bundleOutcome.value.disclaimer;
  }

  if (bundleOutcome.status === "rejected") {
    snapshotError = toSectionError(bundleOutcome.reason, "Could not load measured ROI / telemetry bundle.");
  }

  if (sponsorOutcome.status === "fulfilled") {
    sponsorPack = sponsorOutcome.value;
  }

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
      if (reportResult.value === null) {
        reportMissing = true;
      } else {
        reportMarkdown = reportResult.value;
      }
    } else {
      reportError = toSectionError(reportResult.reason, "Could not load the first-value report.");
    }

    if (explanationResult.status === "fulfilled") {
      explanation = explanationResult.value;
    } else {
      explanationError = toSectionError(
        explanationResult.reason,
        "Could not load the architecture review explanation.",
      );
    }
  }

  return {
    ...initialWhyArchLucidPageState,
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
  };
}

type UseWhyArchLucidPageQueryOptions = {
  readonly reloadNonce?: number;
  readonly enabled?: boolean;
};

export function useWhyArchLucidPageQuery(options?: UseWhyArchLucidPageQueryOptions) {
  const reloadNonce = options?.reloadNonce ?? 0;

  return createOperatorQueryHook<WhyArchLucidPageState>({
    queryKey: operatorQueryKeys.whyArchLucidPageBundle(reloadNonce),
    queryFn: fetchWhyArchLucidPageBundle,
    enabled: options?.enabled ?? true,
  });
}
