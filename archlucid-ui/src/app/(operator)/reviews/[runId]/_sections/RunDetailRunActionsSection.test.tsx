import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { RunDetailRunActionsSection } from "./RunDetailRunActionsSection";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/FunnelTelemetryExportAnchor", () => ({
  FunnelTelemetryExportAnchor: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/components/GenerateSponsorValueReportButton", () => ({
  GenerateSponsorValueReportButton: () => null,
}));

vi.mock("@/components/ShareReviewPackageButton", () => ({
  ShareReviewPackageButton: () => null,
}));

vi.mock("@/components/RunDetailRunGovernanceDispositionActions", () => ({
  RunDetailRunGovernanceDispositionActions: () => null,
}));

vi.mock("@/lib/demo-ui-env", () => ({
  isBuyerPolishedOperatorShellEnv: () => true,
}));

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
  });
});
