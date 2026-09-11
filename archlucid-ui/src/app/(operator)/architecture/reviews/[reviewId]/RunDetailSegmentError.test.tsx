import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/runs/RunDetailMinimalChromeMount", () => ({
  RunDetailMinimalChromeMount: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/live-operator-shell-recovery", () => ({
  isLiveOperatorShellRecoveryContext: () => true,
}));

vi.mock("@/lib/error-telemetry", () => ({
  reportClientError: vi.fn(),
}));

vi.mock("@/lib/auth/error-boundary-idle-snapshot", () => ({
  persistLivelihoodIdleSnapshotsBeforeErrorRecovery: () => false,
}));

import RunDetailSegmentError from "@/app/(operator)/architecture/reviews/[reviewId]/error";

describe("RunDetailSegmentError (LW-096)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("leads with Retry and renders the recovery contract markers", () => {
    const reset = vi.fn();

    render(<RunDetailSegmentError error={new Error("chunk failed")} reset={reset} />);

    expect(screen.getByTestId("operator-error-recovery-contract")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-what-failed")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-intact")).toBeInTheDocument();
    expect(screen.getByTestId("operator-error-recovery-next-step")).toBeInTheDocument();

    const retry = screen.getByTestId("review-detail-segment-error-retry");
    const back = screen.getByTestId("review-detail-segment-error-back");

    expect(retry).toHaveTextContent("Retry");
    expect(back).toHaveTextContent("Back to reviews");
    expect(retry.compareDocumentPosition(back) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(retry);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
