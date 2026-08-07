import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const AZURE_PERMISSIONS_HELP_CANONICAL_PATH = "/help/azure-permissions" as const;

export const AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE =
  "This Azure permissions guide explains read-only roles for cloud connections — it is connector setup orientation, not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status or the live Cloud connections hub before treating permission tables as assurance evidence.";

export const AZURE_PERMISSIONS_HELP_SOURCES_INTRO =
  "Use these follow-ups when permissions detail turns into configuring Azure, parent cloud-connections help, or assurance cites.";

export type AzurePermissionsHelpSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/help/azure-permissions`. */
export const AZURE_PERMISSIONS_HELP_SOURCES: readonly AzurePermissionsHelpSourceLink[] = [
  { label: "Cloud connections hub", href: "/integrations/cloud-connections" },
  { label: "Connect Azure securely", href: inAppHelpHref("cloud-connections-azure") },
  { label: "Cloud connections help", href: inAppHelpHref("cloud-connections") },
  { label: "Assurance status", href: "/security-trust" },
  { label: "How ArchLucid works", href: inAppHelpHref("how-it-works") },
] as const;
