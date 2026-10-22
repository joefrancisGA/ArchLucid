import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { localizeProductCopy } from "@/lib/product-line/product-line-display-name";

/** Quick-start panel checkout lead — ArchLucid checkout wording localizes to SecureNow on the security product line. */
export const EXTRACT_UPLOAD_QUICK_START_CHECKOUT_LEAD = "From your ArchLucid checkout:" as const;

/** Quick-start panel body after the checkout lead. */
export const EXTRACT_UPLOAD_QUICK_START_DESCRIPTION_BODY =
  " sign in to Azure when prompted, then upload ./archlucid-azure-package.zip here." as const;

/** Quick-start panel — ArchLucid checkout wording localizes to SecureNow on the security product line. */
export const EXTRACT_UPLOAD_QUICK_START_DESCRIPTION =
  `${EXTRACT_UPLOAD_QUICK_START_CHECKOUT_LEAD}${EXTRACT_UPLOAD_QUICK_START_DESCRIPTION_BODY}` as const;

/** Cloud inventory command panel lead — product name localizes at render. */
export const EXTRACT_UPLOAD_CLOUD_INVENTORY_CHECKOUT_LEAD =
  "Run from your ArchLucid checkout — no vendor credentials in your cloud account. Upload the resulting ZIP below." as const;

export const EXTRACT_UPLOAD_ACCEPTED_FORMAT_ARCHITECTURE =
  "ZIP produced by Get-ArchLucidAzurePackage.ps1, or a folder of extractor output packaged in-browser." as const;

export const EXTRACT_UPLOAD_ACCEPTED_FORMAT_SECURITY =
  "ZIP produced by the cloud inventory packager script, or a folder of extractor output packaged in-browser." as const;

export function extractUploadQuickStartCheckoutLead(productLineId: ProductLineId = "architecture"): string {
  return localizeProductCopy(productLineId, EXTRACT_UPLOAD_QUICK_START_CHECKOUT_LEAD);
}

export function extractUploadQuickStartDescriptionBody(productLineId: ProductLineId = "architecture"): string {
  return localizeProductCopy(productLineId, EXTRACT_UPLOAD_QUICK_START_DESCRIPTION_BODY);
}

export function extractUploadQuickStartDescription(productLineId: ProductLineId = "architecture"): string {
  return `${extractUploadQuickStartCheckoutLead(productLineId)}${extractUploadQuickStartDescriptionBody(productLineId)}`;
}

export function extractUploadCloudInventoryCheckoutLead(productLineId: ProductLineId = "architecture"): string {
  return localizeProductCopy(productLineId, EXTRACT_UPLOAD_CLOUD_INVENTORY_CHECKOUT_LEAD);
}

export function extractUploadAcceptedFormatDetail(productLineId: ProductLineId = "architecture"): string {
  if (productLineId === "security") {
    return EXTRACT_UPLOAD_ACCEPTED_FORMAT_SECURITY;
  }

  return EXTRACT_UPLOAD_ACCEPTED_FORMAT_ARCHITECTURE;
}

/** Consumer-facing packager script label — avoids ArchLucid script tokens on SecureNow. */
export function extractUploadPackagerScriptReference(productLineId: ProductLineId = "architecture"): string {
  if (productLineId === "security") {
    return "the cloud inventory packager script";
  }

  return "Get-ArchLucidAzurePackage.ps1";
}
