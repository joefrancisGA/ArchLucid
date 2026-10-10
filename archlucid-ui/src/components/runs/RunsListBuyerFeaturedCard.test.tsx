import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RunsListBuyerFeaturedCard } from "@/components/runs/RunsListBuyerFeaturedCard";
import type { RunSummary } from "@/types/authority";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: () => true,
};
});

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
    expect(screen.getByTestId(`runs-row-${SHOWCASE_STATIC_DEMO_RUN_ID}`)).toBeInTheDocument();
    expect(screen.getByTestId(`runs-row-primary-explore-${SHOWCASE_STATIC_DEMO_RUN_ID}`)).toBeInTheDocument();
    expect(screen.getByText(/Approved with monitoring · 1 monitored risk/i)).toBeInTheDocument();
    expect(screen.getByText(/Decision date/i)).toBeInTheDocument();
    expect(screen.getByTestId("runs-list-buyer-featured-card")).toHaveTextContent(/Review owner/i);
    expect(screen.getByText(/Jordan Lee \(Architecture approver\)/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open review/i })).toBeInTheDocument();
    expect(screen.getByText(/Audit trail/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /signed manifest/i })).not.toBeInTheDocument();
  });

  it("does not derive a decision date from review creation time", () => {
    render(
      <RunsListBuyerFeaturedCard
        run={{ ...sampleRun, runId: "run-without-demo-card-metadata" }}
      />,
    );

    expect(screen.getByText("Decision date was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Review owner was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Approval authority was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Last audit event was not stored.")).toBeInTheDocument();
  });

  it("preserves stored in-progress card metadata", () => {
    render(
      <RunsListBuyerFeaturedCard
        run={{ ...sampleRun, runId: "claims-intake-in-progress-003" }}
      />,
    );

    expect(screen.getAllByText("Taylor Morgan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not recorded").length).toBeGreaterThan(0);
    expect(screen.getByText("Review pipeline started")).toBeInTheDocument();
  });
});
