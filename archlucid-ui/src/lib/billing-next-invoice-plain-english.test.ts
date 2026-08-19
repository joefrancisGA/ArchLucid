import { describe, expect, it } from "vitest";

import {
  BILLING_NEXT_INVOICE_MANAGE_CTA_LABEL,
  BILLING_NEXT_INVOICE_OPEN_MANAGE_MESSAGE,
  buildBillingNextInvoicePlainEnglish,
} from "@/lib/billing-next-invoice-plain-english";

describe("billing-next-invoice-plain-english (TB-2223)", () => {
  it("directs operators to Manage billing when amount and date are missing", () => {
    const view = buildBillingNextInvoicePlainEnglish({
      planLabel: "Team",
      status: "active",
      hasSubscription: true,
      provider: "Stripe",
    });

    expect(view.message).toContain(BILLING_NEXT_INVOICE_OPEN_MANAGE_MESSAGE);
    expect(view.message).toContain("Team");
    expect(view.ctaKind).toBe("manage-billing");
    expect(view.ctaLabel).toBe(BILLING_NEXT_INVOICE_MANAGE_CTA_LABEL);
    expect(view.honestyNote).toMatch(/Stripe/i);
  });

  it("formats amount and date when API fields are present", () => {
    const view = buildBillingNextInvoicePlainEnglish({
      hasSubscription: true,
      nextInvoiceAmountCents: 4900,
      nextInvoiceDateUtc: "2026-09-15T12:00:00.000Z",
      currency: "USD",
      planLabel: "Team",
    });

    expect(view.message).toMatch(/\$49\.00/);
    expect(view.message.toLowerCase()).toContain("september");
    expect(view.ctaKind).toBe("none");
    expect(view.ctaLabel).toBeNull();
  });

  it("asks for Manage billing when only amount is present", () => {
    const view = buildBillingNextInvoicePlainEnglish({
      hasSubscription: true,
      provider: "stripe",
      nextInvoiceAmountCents: 9900,
      currency: "usd",
    });

    expect(view.message).toMatch(/\$99\.00/);
    expect(view.message.toLowerCase()).toContain("invoice date");
    expect(view.ctaKind).toBe("manage-billing");
  });

  it("is honest when there is no subscription", () => {
    const view = buildBillingNextInvoicePlainEnglish({
      hasSubscription: false,
      planLabel: "Trial",
    });

    expect(view.message.toLowerCase()).toContain("no next invoice");
    expect(view.ctaKind).toBe("none");
    expect(view.honestyNote).toBeNull();
  });
});
