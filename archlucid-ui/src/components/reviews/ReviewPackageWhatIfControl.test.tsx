import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewPackageWhatIfControl } from "@/components/reviews/ReviewPackageWhatIfControl";

vi.mock("@/hooks/useArchitectWorkspaceChrome", () => ({
  useArchitectWorkspaceChrome: () => true,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe("ReviewPackageWhatIfControl (WA-20)", () => {
  it("is disabled until the package is committed", () => {
    render(
      <ReviewPackageWhatIfControl runId="run-1" packageCommitted={false} pipelineInFlight={false} />,
    );

    expect(screen.queryByTestId("review-package-what-if-compare")).not.toBeInTheDocument();
  });

  it("links to compare with this run as base when committed", () => {
    render(
      <ReviewPackageWhatIfControl runId="run-committed" packageCommitted={true} pipelineInFlight={false} />,
    );

    expect(screen.getByTestId("review-package-what-if-compare")).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews?priorRunId=run-committed",
    );
  });

  it("stays disabled while pipeline is in flight", () => {
    render(
      <ReviewPackageWhatIfControl runId="run-1" packageCommitted={true} pipelineInFlight={true} />,
    );

    expect(screen.queryByTestId("review-package-what-if-compare")).not.toBeInTheDocument();
  });
});
