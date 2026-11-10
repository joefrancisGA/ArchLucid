import { ARCHLUCID_BETA_PACKAGING_LEAD_PRICING_PAGE } from "@/lib/buyer-copy/archlucid-commercial-order-acceptance-copy";

export const ARCHLUCID_BETA_EVALUATION_CONTENTS_HEADING = "Beta evaluation contents" as const;

export const ARCHLUCID_BETA_EVALUATION_CONTENTS_LEAD = ARCHLUCID_BETA_PACKAGING_LEAD_PRICING_PAGE;

export const ARCHLUCID_BETA_EVALUATION_CONTENTS_INCLUDES = [
  "Hosted architecture review workspace with sample and tenant runs",
  "Policy packs, evidence intake, findings, disposition, and sealed-package exports",
  "Trust Center downloads and self-assessment materials",
  "Quote request and procurement next steps through sales",
] as const;

export const ARCHLUCID_BETA_EVALUATION_CONTENTS_EXCLUDES = [
  "Self-serve Stripe checkout before engineering publishes a Price",
  "A sealed tenant review until you start, evidence, and commit your own run",
  "CPA-issued SOC 2 or third-party pen-test publication",
] as const;

export const ARCHLUCID_BETA_EVALUATION_QUOTE_HREF = "/pricing#pricing-quote-request" as const;

export const ARCHLUCID_BETA_EVALUATION_QUOTE_LABEL = "Request procurement next steps" as const;
