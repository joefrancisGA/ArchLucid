import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/use-core-pilot-derived-step-status", () => ({
  useCorePilotDerivedStepStatus: () => ({ isPending: false, nextStepIndex: null }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { RunDetailPreFinalizedEmptyState } from "./RunDetailPreFinalizedEmptyState";

describe("RunDetailPreFinalizedEmptyState", () => {
  it("does not promise completion when the review already failed", () => {
    render(<RunDetailPreFinalizedEmptyState runId="run-1" terminalFailure />);

    expect(screen.getByText("Review did not finalize")).toBeInTheDocument();
    expect(screen.queryByText("Review not ready yet")).not.toBeInTheDocument();
    expect(screen.getByText(/stopped before a sealed review record/)).toBeInTheDocument();
    expect(screen.queryByText(/will appear here/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See audit trail / findings" })).toHaveAttribute(
      "href",
      expect.stringContaining("reviewTab=activity"),
    );
    expect(screen.getByRole("link", { name: "See audit trail / findings" })).toHaveAttribute(
      "href",
      expect.stringContaining("#pipeline-timeline"),
    );
  });

  it("keeps pending copy when the review has not failed", () => {
    render(<RunDetailPreFinalizedEmptyState runId="run-1" />);

    expect(screen.getByText("Review not ready yet")).toBeInTheDocument();
    expect(screen.getByText(/has not been finalized yet/)).toBeInTheDocument();
  });
});
