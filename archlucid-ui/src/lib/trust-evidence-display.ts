import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

const GOLDEN_MANIFEST_TITLE_PATTERN = /golden manifest/i;

export const TRACE_COMPLETENESS_NOT_STORED_LABEL = "Trace completeness was not stored.";

/** Normalizes legacy API placeholders for top-finding trace completeness. */
export function formatTraceCompletenessDisplayLabel(label: string | null | undefined): string {
  const trimmed = label?.trim() ?? "";

  if (trimmed.length === 0 || trimmed === "Not available") {
    return TRACE_COMPLETENESS_NOT_STORED_LABEL;
  }

  return trimmed;
}

/** Proof-chain step label for the committed review record step. */
export function trustEvidenceProofChainManifestStepLabel(): string {
  return SIGNED_MANIFEST_LABEL;
}

/** Maps internal API/demo golden-manifest titles to buyer-safe field labels. */
export function trustEvidenceGoldenManifestFieldTitle(title: string, buyerPolishedShell: boolean): string {
  if (GOLDEN_MANIFEST_TITLE_PATTERN.test(title)) {
    return SIGNED_MANIFEST_LABEL;
  }

  if (!buyerPolishedShell) {
    return title;
  }

  return title;
}

/** Maps internal API/demo golden-manifest field detail lines to buyer-safe copy. */
export function trustEvidenceGoldenManifestFieldDetail(
  detail: string | null | undefined,
): string | null | undefined {
  if (detail === null || detail === undefined) {
    return detail;
  }

  if (GOLDEN_MANIFEST_TITLE_PATTERN.test(detail)) {
    return detail.replace(/golden manifest snapshot/gi, `${SIGNED_MANIFEST_LABEL} snapshot`);
  }

  return detail;
}
