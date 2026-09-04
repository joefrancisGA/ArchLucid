import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TrackedInFlightOperation } from "@/lib/operations/in-flight-operations-store";

const workspaceModeMock = vi.hoisted(() => ({ isWorkingMode: true }));
const inFlightOperationsMock = vi.hoisted(() => [] as readonly TrackedInFlightOperation[]);

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => workspaceModeMock,
}));

vi.mock("@/hooks/use-shell-in-flight-operations", () => ({
  useShellInFlightOperations: () => inFlightOperationsMock,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ReviewDetailSiblingInFlightQueue } from "@/components/reviews/ReviewDetailSiblingInFlightQueue";

function buildOperation(input: {
  readonly operationId: string;
  readonly runId: string;
  readonly title: string;
  readonly stepLabel: string;
}): TrackedInFlightOperation {
  return {
    operationId: input.operationId,
    title: input.title,
    href: `/architecture/reviews/${input.runId}`,
    startedAtMs: Date.now(),
    stepLabel: input.stepLabel,
    state: "Running",
    heartbeatUtc: null,
    runId: input.runId,
    architectureId: null,
    retainUntilConsumed: false,
    terminalToastShown: false,
  };
}

describe("ReviewDetailSiblingInFlightQueue (FD-04)", () => {
  it("lists other in-flight packages while excluding the current review", () => {
    workspaceModeMock.isWorkingMode = true;
    inFlightOperationsMock.length = 0;
    inFlightOperationsMock.push(
      buildOperation({
        operationId: "op-a",
        runId: "run-a",
        title: "Claims platform review",
        stepLabel: "Analyzing findings",
      }),
      buildOperation({
        operationId: "op-b",
        runId: "run-b",
        title: "Payments API review",
        stepLabel: "Building graph",
      }),
    );

    render(<ReviewDetailSiblingInFlightQueue runId="run-a" />);

    expect(screen.getByTestId("review-detail-sibling-in-flight-queue")).toBeInTheDocument();
    expect(screen.getByTestId("review-detail-sibling-in-flight-open-op-b")).toHaveAttribute(
      "href",
      expect.stringContaining("/architecture/reviews/run-b"),
    );
    expect(screen.queryByTestId("review-detail-sibling-in-flight-open-op-a")).toBeNull();
    expect(screen.getByText(/Payments API review/i)).toBeInTheDocument();
    expect(screen.getByText(/Building graph/i)).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(/%/);
    expect(document.body.textContent ?? "").not.toMatch(/progress/i);
  });

  it("points at the reviews hub when no sibling packages are in flight", () => {
    workspaceModeMock.isWorkingMode = true;
    inFlightOperationsMock.length = 0;
    inFlightOperationsMock.push(
      buildOperation({
        operationId: "op-a",
        runId: "run-a",
        title: "Claims platform review",
        stepLabel: "Analyzing findings",
      }),
    );

    render(<ReviewDetailSiblingInFlightQueue runId="run-a" />);

    expect(screen.getByTestId("review-detail-sibling-in-flight-empty")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open the reviews hub/i })).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );
  });

  it("renders nothing outside Working mode", () => {
    workspaceModeMock.isWorkingMode = false;
    inFlightOperationsMock.length = 0;
    inFlightOperationsMock.push(
      buildOperation({
        operationId: "op-b",
        runId: "run-b",
        title: "Payments API review",
        stepLabel: "Building graph",
      }),
    );

    const { container } = render(<ReviewDetailSiblingInFlightQueue runId="run-a" />);

    expect(container).toBeEmptyDOMElement();
  });
});
