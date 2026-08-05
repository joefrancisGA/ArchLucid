import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  EXECUTIVE_ROI_PROOF_STATUS_HELP_HREF,
  ExecutiveRoiProofStatusStrip,
} from "@/app/(operator)/architecture/executive-dashboard/_sections/ExecutiveRoiProofStatusStrip";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";

function baseSummary(overrides: Partial<ExecutiveRoiSummary> = {}): ExecutiveRoiSummary {
  return {
    totalEstimatedUsdSavings: 50000,
    systemCount: 1,
    latestRunCount: 1,
    eaDiscountMultiplier: 1,
    savingsPricingBasis: "Retail",
    systems: [],
    topSystemicIssues: [],
    headlineSavingsScopeCode: "headline-disposition-aware-open-needs-evidence",
    headlineSavingsScopeDescription: "Disposition-aware portfolio headline",
    systemRowSavingsScopeDescription: "Per-system rows do not sum to headline",
    ...overrides,
  };
}

describe("ExecutiveRoiProofStatusStrip", () => {
  it("renders fresh extractor-backed evidence state", () => {
    render(
      <ExecutiveRoiProofStatusStrip
        summary={baseSummary({
          costEvidenceFreshnessStatus: "Fresh",
          costEvidenceStaleAfterDays: 30,
        })}
        executiveSurface
      />,
    );

    expect(screen.getByTestId("exec-roi-proof-status-strip")).toBeInTheDocument();
    expect(screen.getByTestId("exec-roi-proof-cost-evidence-tag")).toHaveTextContent(/Cost evidence: Current/i);
    expect(screen.getByTestId("exec-roi-proof-headline-scope-tag")).toHaveTextContent(/Headline scope:/i);
    expect(screen.getByTestId("exec-roi-proof-roi-methodology-link")).toHaveAttribute(
      "href",
      EXECUTIVE_ROI_PROOF_STATUS_HELP_HREF,
    );
    expect(screen.getByTestId("exec-roi-proof-baseline-settings-link")).toHaveAttribute("href", "/administration/baseline");
    expect(screen.getByText(/Per-system rows do not sum to headline/i)).toBeInTheDocument();
  });

  it("renders stale evidence with runbook link and needs-attention tag", () => {
    render(
      <ExecutiveRoiProofStatusStrip
        summary={baseSummary({
          costEvidenceFreshnessStatus: "Stale",
          costEvidenceStaleAfterDays: 14,
        })}
      />,
    );

    expect(screen.getByTestId("exec-roi-proof-cost-evidence-tag")).toHaveTextContent(/Cost evidence: Stale/i);
    expect(screen.getByTestId("exec-roi-proof-extractor-runbook-link")).toBeInTheDocument();
    expect(screen.getByText(/older than 14 day/i)).toBeInTheDocument();
  });

  it("renders unknown evidence when freshness status is missing", () => {
    render(
      <ExecutiveRoiProofStatusStrip
        summary={baseSummary({
          costEvidenceFreshnessStatus: undefined,
          savingsPricingBasis: "Retail",
        })}
        executiveSurface
      />,
    );

    expect(screen.getByTestId("exec-roi-proof-cost-evidence-tag")).toHaveTextContent(/Cost evidence:/i);
    expect(screen.getByTestId("exec-roi-proof-extractor-runbook-link")).toBeInTheDocument();
  });
});
