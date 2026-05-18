import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CompareBuyerScopedGate } from "./CompareBuyerScopedGate";

describe("CompareBuyerScopedGate", () => {
  it("renders back link and sample load control", () => {
    render(<CompareBuyerScopedGate onLoadSampleComparison={vi.fn()} />);

    expect(screen.getByTestId("compare-buyer-scoped-gate")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to review package/i })).toHaveAttribute(
      "href",
      "/reviews/claims-intake-modernization/manifest",
    );
    expect(screen.getByRole("button", { name: /load sample claims intake comparison/i })).toBeInTheDocument();
  });

  it("invokes onLoadSampleComparison when sample button is clicked", async () => {
    const user = userEvent.setup();
    const onLoadSampleComparison = vi.fn();

    render(<CompareBuyerScopedGate onLoadSampleComparison={onLoadSampleComparison} />);

    await user.click(screen.getByRole("button", { name: /load sample claims intake comparison/i }));

    expect(onLoadSampleComparison).toHaveBeenCalledTimes(1);
  });
});
