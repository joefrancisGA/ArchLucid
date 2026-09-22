import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import { cloudInventoryPlatformLabel } from "@/lib/cloud-inventory-platform";
import { extractUploadAcceptedFormatDetail } from "@/lib/extract-upload-product-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type ExtractorUploadConstraint = {
  readonly label: string;
  readonly detail: string;
};

export function extractorUploadConstraints(
  platform: CloudInventoryPlatform = "azure",
  maxZipBytes: number = ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES,
  productLineId: ProductLineId = "architecture",
): ExtractorUploadConstraint[] {
  const maxMb = Math.floor(maxZipBytes / (1024 * 1024));
  const platformLabel = cloudInventoryPlatformLabel(platform);

  return [
    {
      label: "Accepted format",
      detail: extractUploadAcceptedFormatDetail(productLineId),
    },
    {
      label: "Required file",
      detail: "manifest.json at the ZIP root (or inside the selected folder).",
    },
    {
      label: "Size limit",
      detail: `Maximum ${maxMb} MB per upload.`,
    },
    {
      label: "Evidence trail",
      detail: `${platformLabel} inventory feeds findings and sealed review records through the evidence trail — not a standalone export.`,
    },
  ];
}
