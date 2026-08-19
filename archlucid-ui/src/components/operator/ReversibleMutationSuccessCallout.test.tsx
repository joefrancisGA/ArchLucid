import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MUTATION_UNDO_WINDOW_SECONDS } from "@/lib/mutation-reversibility-registry";
import { ReversibleMutationSuccessCallout } from "@/components/operator/ReversibleMutationSuccessCallout";

describe("ReversibleMutationSuccessCallout (TB-2148)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows undo for reversible mutations and hides after the window elapses", () => {
    const onUndo = vi.fn();

    render(
      <ReversibleMutationSuccessCallout
        message="Marked 2 finding(s) as accepted."
        mutationId="governance_bulk_disposition"
        onUndo={onUndo}
      />,
    );

    expect(screen.getByText("Marked 2 finding(s) as accepted.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByText(`Available for ${MUTATION_UNDO_WINDOW_SECONDS} seconds`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));

    expect(onUndo).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(MUTATION_UNDO_WINDOW_SECONDS * 1000);
    });

    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });

  it("does not show undo for permanent governance mutations", () => {
    render(
      <ReversibleMutationSuccessCallout
        message="Approval recorded."
        mutationId="governance_quick_approve"
        onUndo={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
  });
});
