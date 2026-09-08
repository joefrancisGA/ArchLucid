import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const inFlightOperationsMock = vi.hoisted(() => [] as readonly unknown[]);

vi.mock("@/hooks/use-shell-in-flight-operations", () => ({
  useShellInFlightOperations: () => inFlightOperationsMock,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

import { RunDetailInFlightDeskChrome } from "@/components/reviews/RunDetailInFlightDeskChrome";
import { architectureIdentityPath } from "@/lib/architecture/architecture-routes";

describe("RunDetailInFlightDeskChrome (IS-09 / WS-17)", () => {
  it("shows pipeline banner, escape copy, and sibling queue without blocking the workspace", () => {
    render(
      <RunDetailInFlightDeskChrome
        runId="run-a"
        pipelineBanner={<div data-testid="pipeline-banner">Running</div>}
      />,
    );

    expect(screen.getByTestId("run-detail-in-flight-desk-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-banner")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-in-flight-desk-escape-copy")).toHaveTextContent(/architecture desk/i);
    expect(screen.getByTestId("run-detail-in-flight-desk-escape-copy")).not.toHaveTextContent(/stay on this page/i);
    expect(screen.getByTestId("review-detail-sibling-in-flight-empty")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/%/);
  });

  it("links back to the architecture desk when architectureId is known", () => {
    render(
      <RunDetailInFlightDeskChrome
        runId="run-a"
        architectureId="arch-42"
        pipelineBanner={<div data-testid="pipeline-banner">Running</div>}
      />,
    );

    expect(screen.getByTestId("run-detail-in-flight-desk-continue-link")).toHaveAttribute(
      "href",
      architectureIdentityPath("arch-42"),
    );
  });
});
