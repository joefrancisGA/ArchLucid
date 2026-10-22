import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";
import { getShowcaseCompareHref } from "@/lib/buyer/buyer-safe-review-navigation";

const BACKUP_ENV = process.env;

vi.mock("@/hooks/use-prior-same-request-compare-href", () => ({
  usePriorSameRequestCompareHref: () => ({
    compareWithPriorHref: null,
    hasSameRequestPrior: false,
  }),
}));

describe("PostCommitAdvancedAnalysisHint", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...BACKUP_ENV };
    vi.restoreAllMocks();
  });

  it("surfaces showcase compare CTA on the curated demo run when buyer chrome is enabled", async () => {
    process.env = { ...BACKUP_ENV, NEXT_PUBLIC_DEMO_MODE: "true", NEXT_PUBLIC_DEMO_STATIC_OPERATOR: "false" };

    const { PostCommitAdvancedAnalysisHint: Hint } = await import("@/components/PostCommitAdvancedAnalysisHint");

    render(<Hint runId={CUSTOMER_INTAKE_SAMPLE_RUN_ID} />);

    const compareCta = screen.getByTestId("post-commit-compare-prior-cta");

    expect(compareCta).toHaveAttribute("href", getShowcaseCompareHref());
    expect(compareCta).toHaveTextContent(/view review change comparison/i);
  });
});
