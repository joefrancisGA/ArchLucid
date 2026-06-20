import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isCtoDemoPresenterSafeModeEnv } from "@/lib/cto-demo-presenter-pack";

export type ExecutiveKpiCountState = "loading" | "missing" | "zero" | "value";

export type ExecutiveKpiCountPresentation = {
  readonly display: string;
  readonly state: ExecutiveKpiCountState;
  readonly footnote: string | null;
};

export function presentExecutiveKpiCount(
  value: number | undefined,
  options: { readonly loading: boolean; readonly suppressZeroFootnote?: boolean },
): ExecutiveKpiCountPresentation {
  if (options.loading) {
    return { display: "…", state: "loading", footnote: null };
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return {
      display: "—",
      state: "missing",
      footnote: isBuyerPolishedOperatorShellEnv()
        ? "Not available for this workspace yet."
        : "Not returned by the executive ROI summary API for this tenant.",
    };
  }

  if (value === 0) {
    return {
      display: "0",
      state: "zero",
      footnote: options.suppressZeroFootnote === true
        ? null
        : "Zero is a measured count for this window — not a missing-data placeholder.",
    };
  }

  return {
    display: new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value),
    state: "value",
    footnote: null,
  };
}

export type CostEvidenceFreshnessPresentation = {
  readonly display: string;
  readonly state: "loading" | "missing" | "fresh" | "stale" | "not-estimated" | "demo-derived";
  readonly footnote: string | null;
  readonly runbookHref: string | null;
};

export function presentCostEvidenceFreshness(input: {
  readonly loading: boolean;
  readonly status: string | undefined;
  readonly savingsPricingBasis: string | undefined;
  readonly staleAfterDays: number | undefined;
  readonly executiveSurface?: boolean;
}): CostEvidenceFreshnessPresentation {
  const executiveSurface = input.executiveSurface === true;
  if (input.loading) {
    return { display: "…", state: "loading", footnote: null, runbookHref: null };
  }

  const basis = input.savingsPricingBasis?.trim().toLowerCase() ?? "";

  if (basis.includes("demo") || basis.includes("illustrative")) {
    if (isCtoDemoPresenterSafeModeEnv()) {
      return {
        display: "Showcase review",
        state: "demo-derived",
        footnote: "Seeded Claims Intake showcase — upload your Azure inventory to ground cost evidence in measured spend.",
        runbookHref: "/docs/runbooks/AZURE_EXTRACTOR_UPLOAD.md",
      };
    }

    const footnote = isBuyerPolishedOperatorShellEnv()
      ? "Upload your Azure inventory to ground cost evidence in measured spend."
      : "Cost evidence is illustrative — do not treat as measured Azure spend.";

    return {
      display: "Illustrative",
      state: "demo-derived",
      footnote,
      runbookHref: isBuyerPolishedOperatorShellEnv()
        ? "/docs/runbooks/AZURE_EXTRACTOR_UPLOAD.md"
        : null,
    };
  }

  const status = input.status?.trim();

  if (!status) {
    return {
      display: executiveSurface ? "Not uploaded" : "Unavailable",
      state: "missing",
      footnote: executiveSurface
        ? "Upload Azure inventory to ground savings in measured spend."
        : "No cost evidence freshness signal was returned.",
      runbookHref: "/docs/runbooks/AZURE_EXTRACTOR_UPLOAD.md",
    };
  }

  if (/stale/i.test(status)) {
    return {
      display: executiveSurface ? "Out of date" : status,
      state: "stale",
      footnote:
        input.staleAfterDays && input.staleAfterDays > 0
          ? `Evidence is older than ${input.staleAfterDays} day(s). Refresh your Azure inventory upload.`
          : "Evidence is stale. Refresh your Azure inventory upload.",
      runbookHref: "/docs/runbooks/AZURE_EXTRACTOR_UPLOAD.md",
    };
  }

  if (/not estimated|unavailable|missing/i.test(status)) {
    return {
      display: executiveSurface ? "Not uploaded" : status,
      state: "not-estimated",
      footnote: executiveSurface
        ? "Upload Azure inventory to ground savings in measured spend."
        : "ROI cost findings are not backed by fresh measured evidence yet.",
      runbookHref: "/docs/runbooks/AZURE_EXTRACTOR_UPLOAD.md",
    };
  }

  return {
    display: executiveSurface && /fresh/i.test(status) ? "Current" : status,
    state: "fresh",
    footnote: null,
    runbookHref: null,
  };
}
