import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

import { ImpactPreviewEvidenceBasisSection } from "@/app/(operator)/insights/impact-preview/_sections/ImpactPreviewEvidenceBasisSection";
import { IMPACT_PREVIEW_BASELINE_REVIEW_ID_LABEL } from "@/lib/impact-preview-page-copy";

describe("ImpactPreviewEvidenceBasisSection buyer-polished shell", () => {
  it("links to the baseline review without exposing the raw id in the primary label", () => {
    render(
      <ImpactPreviewEvidenceBasisSection
        baselineRunId="run-baseline-42"
        linkedRunIds={["run-linked-1"]}
        policyRulesLabel="Open governance workflow"
      />,
    );

    expect(screen.getByRole("link", { name: "Open baseline review" })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-baseline-42",
    );
    expect(screen.getByText(IMPACT_PREVIEW_BASELINE_REVIEW_ID_LABEL)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show details" })).toBeInTheDocument();
    expect(screen.queryByText("run-baseline-42")).not.toBeInTheDocument();
  });
});
