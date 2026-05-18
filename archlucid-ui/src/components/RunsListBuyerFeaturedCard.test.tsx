import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunsListBuyerFeaturedCard } from "./RunsListBuyerFeaturedCard";
import type { RunSummary } from "@/types/authority";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

const sampleRun: RunSummary = {
  runId: SHOWCASE_STATIC_DEMO_RUN_ID,
  projectId: "default",
  createdUtc: "2026-01-01T00:00:00Z",
  hasGoldenManifest: true,
  hasFindingsSnapshot: true,
  hasGraphSnapshot: true,
  hasContextSnapshot: true,
  description: "Claims Intake Modernization",
};

describe("RunsListBuyerFeaturedCard", () => {
  it("renders decision outcome and primary navigation", () => {
    render(<RunsListBuyerFeaturedCard run={sampleRun} />);

    expect(screen.getByTestId("runs-list-buyer-featured-card")).toBeInTheDocument();
    expect(screen.getByText(/Decision: Approved with monitoring/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view review package/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /signed manifest/i })).toBeInTheDocument();
  });
});
