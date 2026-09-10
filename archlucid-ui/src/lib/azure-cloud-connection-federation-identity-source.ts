import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { localizeProductCopy } from "@/lib/product-line/product-line-display-name";

/**
 * Shared sourcing copy for ArchLucid tenant ID and managed identity object ID
 * used by Azure federated credential setup (wizard + help).
 */
export const AZURE_FEDERATION_IDENTIFIER_SOURCING_LEAD =
  "ArchLucid publishes tenant ID and managed identity object ID per environment. When they are not pre-filled below, obtain the current values from";

export function azureFederationIdentifierSourcingLead(productLineId: ProductLineId = "architecture"): string {
  return localizeProductCopy(productLineId, AZURE_FEDERATION_IDENTIFIER_SOURCING_LEAD);
}

export const AZURE_FEDERATION_IDENTIFIER_SOURCING_MID = "or";

export const AZURE_FEDERATION_IDENTIFIER_SOURCING_TAIL =
  "when values are environment-specific.";

export const AZURE_FEDERATION_IDENTIFIER_UNPUBLISHED_VALUE =
  "Not published in this UI build";

export const AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_LEAD =
  "Federation identifiers are not pre-filled in this UI build. Obtain the ArchLucid tenant ID and managed identity object ID from";

export function azureFederationSetupScriptUnavailableLead(productLineId: ProductLineId = "architecture"): string {
  return localizeProductCopy(productLineId, AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_LEAD);
}

export const AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_MID = "or";

export const AZURE_FEDERATION_SETUP_SCRIPT_UNAVAILABLE_TAIL =
  "before running the CLI script, or deploy the infrastructure templates instead.";
