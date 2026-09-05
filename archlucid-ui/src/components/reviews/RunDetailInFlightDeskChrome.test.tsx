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

describe("RunDetailInFlightDeskChrome (IS-09)", () => {
  it("shows pipeline banner, escape copy, and sibling queue without blocking the workspace", () => {
    render(
      <RunDetailInFlightDeskChrome
        runId="run-a"
        pipelineBanner={<div data-testid="pipeline-banner">Running</div>}
      />,
    );

    expect(screen.getByTestId("run-detail-in-flight-desk-chrome")).toBeInTheDocument();
    expect(screen.getByTestId("pipeline-banner")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-in-flight-desk-escape-copy")).toHaveTextContent(/other packages/i);
    expect(screen.getByTestId("review-detail-sibling-in-flight-empty")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/%/);
  });
});
