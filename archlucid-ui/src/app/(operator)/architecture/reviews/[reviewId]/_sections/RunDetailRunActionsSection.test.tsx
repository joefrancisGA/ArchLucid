import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailRunActionsSection } from "./RunDetailRunActionsSection";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/ExportTrackedAnchor", () => ({
  ExportTrackedAnchor: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/exports/traceability-bundle-download", () => ({
  downloadTraceabilityBundleWithWorkingGate: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/components/GenerateSponsorValueReportButton", () => ({
  GenerateSponsorValueReportButton: () => null,
}));

vi.mock("@/components/ShareReviewPackageButton", () => ({
  ShareReviewPackageButton: () => null,
}));

vi.mock("@/components/runs/RunDetailRunGovernanceDispositionActions", () => ({
  RunDetailRunGovernanceDispositionActions: () => null,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: () => true,
  useProductionDeskChrome: () => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: () => true,
};
});

describe("RunDetailRunActionsSection", () => {
  it("does not surface pipeline diagnostics in the primary Actions card", () => {
    render(
      <RunDetailRunActionsSection
        runId="run-1"
        systemName="Retail API"
        manifestId="manifest-1"
        hasCommitBlockingFailures={false}
      />,
    );

    expect(screen.queryByRole("link", { name: "Pipeline diagnostics" })).not.toBeInTheDocument();
    expect(screen.queryByText(/optional detail for operators troubleshooting pipeline steps/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Deliverables & exports/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/scorecard generation/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download evidence bundle (ZIP)" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /traceability bundle/i })).not.toBeInTheDocument();
  });
});
