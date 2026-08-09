import { fireEvent, render, screen } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";

describe("OperatorSuccessCallout", () => {
  it("renders message and dismiss control", () => {
    const onDismiss = vi.fn();

    render(
      <OperatorSuccessCallout
        message="Governance approval recorded."
        testId="test-success-callout"
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByTestId("test-success-callout")).toHaveTextContent("Governance approval recorded.");
    fireEvent.click(screen.getByTestId("test-success-callout-dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });
});
