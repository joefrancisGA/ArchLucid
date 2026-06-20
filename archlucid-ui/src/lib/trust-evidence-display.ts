import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

const GOLDEN_MANIFEST_TITLE_PATTERN = /golden manifest/i;

/** Proof-chain step label for the committed review record step. */
export function trustEvidenceProofChainManifestStepLabel(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? SIGNED_MANIFEST_LABEL : "Manifest";
}

/** Maps internal API/demo golden-manifest titles to buyer-safe field labels. */
export function trustEvidenceGoldenManifestFieldTitle(title: string, buyerPolishedShell: boolean): string {
  if (!buyerPolishedShell) {
    return title;
  }

  if (GOLDEN_MANIFEST_TITLE_PATTERN.test(title)) {
    return SIGNED_MANIFEST_LABEL;
  }

  return title;
}

/** Maps internal API/demo golden-manifest field detail lines to buyer-safe copy. */
export function trustEvidenceGoldenManifestFieldDetail(
  detail: string | null | undefined,
  buyerPolishedShell: boolean,
): string | null | undefined {
  if (!buyerPolishedShell || detail === null || detail === undefined) {
    return detail;
  }

  if (GOLDEN_MANIFEST_TITLE_PATTERN.test(detail)) {
    return detail.replace(/golden manifest snapshot/gi, `${SIGNED_MANIFEST_LABEL} snapshot`);
  }

  return detail;
}
