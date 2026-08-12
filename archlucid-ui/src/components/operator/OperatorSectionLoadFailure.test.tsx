import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";

describe("OperatorSectionLoadFailure (TB-2380)", () => {
  it("announces the failure as an alert rather than a status", () => {
    render(<OperatorSectionLoadFailure message="Could not load tenant health." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not load tenant health.");
  });

  it("omits the retry control when the section cannot re-fetch", () => {
    render(<OperatorSectionLoadFailure message="Could not load tenant health." />);

    expect(screen.queryByRole("button")).toBeNull();
  });

  it("invokes onRetry when the retry control is used", () => {
    const onRetry = vi.fn();

    render(<OperatorSectionLoadFailure message="Could not load." onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("honours a custom retry label", () => {
    render(
      <OperatorSectionLoadFailure message="Could not load." retryLabel="Reload corpora" onRetry={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Reload corpora" })).toBeInTheDocument();
  });

  it("disables the retry control while a retry is in flight", () => {
    render(<OperatorSectionLoadFailure message="Could not load." retrying onRetry={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Retrying…" })).toBeDisabled();
  });

  it("uses the supplied test id for both the shell and the retry control", () => {
    render(
      <OperatorSectionLoadFailure message="Could not load." testId="tenant-health-failure" onRetry={vi.fn()} />,
    );

    expect(screen.getByTestId("tenant-health-failure")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-health-failure-retry")).toBeInTheDocument();
  });
});
