import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE } from "@/lib/governance-mutation-outcome-copy";

describe("OperatorSuccessCallout", () => {
  it("renders message and dismisses on control click", () => {
    const onDismiss = vi.fn();

    render(
      <OperatorSuccessCallout
        message={GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE}
        testId="operator-success-callout-fixture"
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByTestId("operator-success-callout-fixture")).toHaveTextContent(
      GOVERNANCE_QUICK_APPROVE_SUCCESS_MESSAGE,
    );

    fireEvent.click(screen.getByTestId("operator-success-callout-fixture-dismiss"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
