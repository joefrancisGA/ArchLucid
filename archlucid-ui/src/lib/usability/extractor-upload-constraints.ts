import { ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES } from "@/lib/azure-extractor-upload-limits";
import { extractUploadAcceptedFormatDetail } from "@/lib/extract-upload-product-copy";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type ExtractorUploadConstraint = {
  readonly label: string;
  readonly detail: string;
};

export function extractorUploadConstraints(
  maxZipBytes: number = ARCH_LUCID_AZURE_EXTRACTOR_MAX_ZIP_BYTES,
  productLineId: ProductLineId = "architecture",
): ExtractorUploadConstraint[] {
  const maxMb = Math.floor(maxZipBytes / (1024 * 1024));

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
      label: "What gets extracted",
      detail: "Azure resource inventory, tags, and architecture context — linked through the evidence trail to findings in your review.",
    },
  ];
}
