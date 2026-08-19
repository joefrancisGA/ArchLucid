import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReviewLabelTokenInput } from "./ReviewLabelTokenInput";

describe("ReviewLabelTokenInput", () => {
  it("adds labels on Enter and ignores case-insensitive duplicates", () => {
    const onChange = vi.fn();

    render(<ReviewLabelTokenInput labels={["Production"]} onChange={onChange} />);

    const input = screen.getByTestId("alert-routing-review-labels-input");
    fireEvent.change(input, { target: { value: "production" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "PHI" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["Production", "PHI"]);
  });

  it("removes the last label on Backspace when the draft is empty", () => {
    const onChange = vi.fn();

    render(<ReviewLabelTokenInput labels={["Production", "PHI"]} onChange={onChange} />);

    const input = screen.getByTestId("alert-routing-review-labels-input");
    fireEvent.keyDown(input, { key: "Backspace" });

    expect(onChange).toHaveBeenCalledWith(["Production"]);
  });
});
