import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/billing-portal-client", () => ({
  startBillingPortal: vi.fn(),
}));

import { BillingNextInvoicePlainEnglishNotice } from "@/components/billing/BillingNextInvoicePlainEnglishNotice";
import { BILLING_NEXT_INVOICE_OPEN_MANAGE_MESSAGE } from "@/lib/billing-next-invoice-plain-english";

describe("BillingNextInvoicePlainEnglishNotice (TB-2223)", () => {
  it("shows Manage billing CTA when invoice amount and date are unavailable", () => {
    render(
      <BillingNextInvoicePlainEnglishNotice
        canMutate
        hasSubscription
        provider="Stripe"
        planLabel="Team"
        status="active"
      />,
    );

    expect(screen.getByTestId("billing-next-invoice-plain-english-message")).toHaveTextContent(
      BILLING_NEXT_INVOICE_OPEN_MANAGE_MESSAGE,
    );
    expect(screen.getByTestId("billing-next-invoice-plain-english-honesty")).toHaveTextContent(/Stripe/i);
    expect(screen.getByTestId("billing-next-invoice-manage-billing")).toBeInTheDocument();
  });

  it("omits Manage billing CTA when amount and date are present", () => {
    render(
      <BillingNextInvoicePlainEnglishNotice
        canMutate
        hasSubscription
        nextInvoiceAmountCents={4900}
        nextInvoiceDateUtc="2026-09-15T12:00:00.000Z"
        currency="USD"
      />,
    );

    expect(screen.getByTestId("billing-next-invoice-plain-english-message")).toHaveTextContent(/\$49\.00/);
    expect(screen.queryByTestId("billing-next-invoice-manage-billing")).not.toBeInTheDocument();
  });
});
