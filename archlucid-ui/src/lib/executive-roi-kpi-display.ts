export type ExecutiveKpiCountState = "loading" | "missing" | "zero" | "value";

export type ExecutiveKpiCountPresentation = {
  readonly display: string;
  readonly state: ExecutiveKpiCountState;
  readonly footnote: string | null;
};

export function presentExecutiveKpiCount(
  value: number | undefined,
  options: { readonly loading: boolean },
): ExecutiveKpiCountPresentation {
  if (options.loading) {
    return { display: "…", state: "loading", footnote: null };
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return {
      display: "—",
      state: "missing",
      footnote: "Not returned by the executive ROI summary API for this tenant.",
    };
  }

  if (value === 0) {
    return {
      display: "0",
      state: "zero",
      footnote: "Zero is a measured count for this window — not a missing-data placeholder.",
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
}): CostEvidenceFreshnessPresentation {
  if (input.loading) {
    return { display: "…", state: "loading", footnote: null, runbookHref: null };
  }

  const basis = input.savingsPricingBasis?.trim().toLowerCase() ?? "";

  if (basis.includes("demo") || basis.includes("illustrative")) {
    return {
      display: "Demo-derived",
      state: "demo-derived",
      footnote: "Cost evidence is illustrative — do not treat as measured Azure spend.",
      runbookHref: null,
    };
  }

  const status = input.status?.trim();

  if (!status) {
    return {
      display: "Unavailable",
      state: "missing",
      footnote: "No cost evidence freshness signal was returned.",
      runbookHref: "/docs/runbooks/AZURE_EXTRACTOR_UPLOAD.md",
    };
  }

  if (/stale/i.test(status)) {
    return {
      display: status,
      state: "stale",
      footnote:
        input.staleAfterDays && input.staleAfterDays > 0
          ? `Evidence is older than ${input.staleAfterDays} day(s). Refresh Azure extractor upload or attach proof-packet cost artifacts.`
          : "Evidence is stale. Refresh Azure extractor upload or attach proof-packet cost artifacts.",
      runbookHref: "/docs/runbooks/AZURE_EXTRACTOR_UPLOAD.md",
    };
  }

  if (/not estimated|unavailable|missing/i.test(status)) {
    return {
      display: status,
      state: "not-estimated",
      footnote: "ROI cost findings are not backed by fresh measured evidence yet.",
      runbookHref: "/docs/go-to-market/demo-proof-packets/README.md",
    };
  }

  return {
    display: status,
    state: "fresh",
    footnote: null,
    runbookHref: null,
  };
}
