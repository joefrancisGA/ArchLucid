import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorBillingPaymentPastDueBanner } from "@/app/(operator)/administration/billing/OperatorBillingPaymentPastDueBanner";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

const useBillingSubscriptionStatusQuery = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-billing-subscription-status-query", () => ({
  useBillingSubscriptionStatusQuery,
}));

vi.mock("@/app/(operator)/administration/billing/OperatorBillingManageBillingAction", () => ({
  OperatorBillingManageBillingAction: () => <button type="button">Update payment method</button>,
}));

describe("OperatorBillingPaymentPastDueBanner (TB-2144)", () => {
  beforeEach(() => {
    useBillingSubscriptionStatusQuery.mockReset();
    useBillingSubscriptionStatusQuery.mockReturnValue({ data: null });
  });

  it("renders nothing when subscription is not past due", () => {
    useBillingSubscriptionStatusQuery.mockReturnValue({
      data: { hasSubscription: true, isPaymentPastDue: false },
    });

    const { container } = renderWithOperatorQuery(
      <OperatorBillingPaymentPastDueBanner canMutate={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the past-due banner when subscription payment is past due", () => {
    useBillingSubscriptionStatusQuery.mockReturnValue({
      data: { hasSubscription: true, isPaymentPastDue: true },
    });

    renderWithOperatorQuery(<OperatorBillingPaymentPastDueBanner canMutate />);

    expect(screen.getByTestId("operator-billing-payment-past-due-banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update payment method" })).toBeInTheDocument();
  });
});
