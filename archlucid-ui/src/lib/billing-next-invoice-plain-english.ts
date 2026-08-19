/**
 * Plain-English next-invoice copy for operator billing (TB-2223).
 * Builds from available plan/status fields; honest when amount/date live only in Stripe.
 */

export type BillingNextInvoicePlainEnglishInput = {
  readonly planLabel?: string | null;
  readonly status?: string | null;
  readonly hasSubscription?: boolean | null;
  readonly provider?: string | null;
  readonly nextInvoiceAmountCents?: number | null;
  readonly nextInvoiceDateUtc?: string | null;
  readonly currency?: string | null;
};

export type BillingNextInvoiceCtaKind = "manage-billing" | "none";

export type BillingNextInvoicePlainEnglish = {
  readonly message: string;
  readonly ctaLabel: string | null;
  readonly ctaKind: BillingNextInvoiceCtaKind;
  readonly honestyNote: string | null;
};

export const BILLING_NEXT_INVOICE_MANAGE_CTA_LABEL = "Manage billing" as const;

export const BILLING_NEXT_INVOICE_OPEN_MANAGE_MESSAGE =
  "Open Manage billing for next invoice amount and date" as const;

export const BILLING_STRIPE_PORTAL_SYSTEM_OF_RECORD_NOTE =
  "Invoice history, payment methods, and cancellation are managed in the Stripe billing portal. ArchLucid opens that portal on your behalf; Stripe remains the system of record.";

function nonEmpty(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function isStripeProvider(provider: string | null): boolean {
  if (provider === null) {
    return false;
  }

  return provider.toLowerCase().includes("stripe");
}

function formatInvoiceAmount(cents: number, currency: string | null): string {
  const amount = cents / 100;
  const code = (nonEmpty(currency) ?? "USD").toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatInvoiceDate(utc: string): string | null {
  const ms = Date.parse(utc);

  if (Number.isNaN(ms)) {
    return null;
  }

  // Invoice dates read as a long month locally; the shared date formatter is short-month only,
  // so the shape stays here with the time zone pinned so every operator reads the same day.
  return new Date(ms).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildPlanStatusClause(plan: string | null, status: string | null): string {
  if (plan !== null && status !== null) {
    return ` Plan ${plan} is ${status}.`;
  }

  if (plan !== null) {
    return ` Current plan: ${plan}.`;
  }

  if (status !== null) {
    return ` Subscription status: ${status}.`;
  }

  return "";
}

/**
 * Builds next-invoice plain English from API fields when present.
 * When amount and date are missing, directs the operator to Manage billing (Stripe portal).
 */
export function buildBillingNextInvoicePlainEnglish(
  input: BillingNextInvoicePlainEnglishInput,
): BillingNextInvoicePlainEnglish {
  const plan = nonEmpty(input.planLabel);
  const status = nonEmpty(input.status);
  const provider = nonEmpty(input.provider);
  const stripeOnly = isStripeProvider(provider);
  const amountCents = input.nextInvoiceAmountCents;
  const hasAmount =
    typeof amountCents === "number" && Number.isFinite(amountCents) && amountCents >= 0;
  const dateRaw = nonEmpty(input.nextInvoiceDateUtc);
  const formattedDate = dateRaw !== null ? formatInvoiceDate(dateRaw) : null;
  const hasDate = formattedDate !== null;
  const planStatusClause = buildPlanStatusClause(plan, status);

  if (input.hasSubscription === false) {
    return {
      message: `No next invoice yet.${planStatusClause} Choose a paid plan when you are ready to subscribe.`,
      ctaLabel: null,
      ctaKind: "none",
      honestyNote: null,
    };
  }

  if (!hasAmount && !hasDate) {
    const honestyNote = stripeOnly
      ? "Next invoice amount and date are shown in the Stripe billing portal. ArchLucid does not receive those fields on this page yet."
      : "Next invoice amount and date are not available from ArchLucid yet. Use Manage billing when your payment provider portal lists them.";

    return {
      message: `${BILLING_NEXT_INVOICE_OPEN_MANAGE_MESSAGE}.${planStatusClause}`.trim(),
      ctaLabel: BILLING_NEXT_INVOICE_MANAGE_CTA_LABEL,
      ctaKind: "manage-billing",
      honestyNote,
    };
  }

  if (hasAmount && hasDate) {
    return {
      message: `Next invoice: ${formatInvoiceAmount(amountCents as number, input.currency ?? null)} on ${formattedDate}.${planStatusClause}`,
      ctaLabel: null,
      ctaKind: "none",
      honestyNote: stripeOnly
        ? "Amount and date above come from billing fields ArchLucid already has. Stripe remains the system of record for payment methods."
        : null,
    };
  }

  if (hasAmount) {
    return {
      message: `Next invoice amount: ${formatInvoiceAmount(amountCents as number, input.currency ?? null)}.${planStatusClause} Open Manage billing for the invoice date.`,
      ctaLabel: BILLING_NEXT_INVOICE_MANAGE_CTA_LABEL,
      ctaKind: "manage-billing",
      honestyNote: stripeOnly
        ? "Invoice date is shown in the Stripe billing portal when ArchLucid does not have it yet."
        : null,
    };
  }

  return {
    message: `Next invoice date: ${formattedDate}.${planStatusClause} Open Manage billing for the invoice amount.`,
    ctaLabel: BILLING_NEXT_INVOICE_MANAGE_CTA_LABEL,
    ctaKind: "manage-billing",
    honestyNote: stripeOnly
      ? "Invoice amount is shown in the Stripe billing portal when ArchLucid does not have it yet."
      : null,
  };
}
