import { applyBuyerDemoVocabulary } from "@/lib/vocabulary/buyer-demo-vocabulary";
import { isBuyerVocabularyPassActive } from "@/lib/demo-ui-env";

/**
 * Presentation-layer labels toggled by governance mode — routes and API DTOs stay unchanged.
 */
export const GOVERNANCE_MODE_COPY = {
  toggleLabel: "Enable approval view",
  toggleTitle:
    "Show enterprise approval terminology, audit trail navigation, and compliance panels.",
  toggleAssistiveOn: "Approval view on. Full approval labels and panels are visible.",
  toggleAssistiveOff:
    "Approval view off. Pilot-friendly review labels and a focused review detail layout.",
  toggleFootnote:
    "Default for new architects — turn on when you need policy packs, audit trail, and authority-chain detail.",
} as const;

export type GovernanceModeVocabulary = {
  readonly reviewSingular: string;
  readonly reviewPlural: string;
  readonly reviewDetailTitle: string;
  readonly goldenManifestLabel: string;
  readonly authorityChainLabel: string;
  readonly manifestSummaryHeading: string;
};

const PILOT_VOCABULARY: GovernanceModeVocabulary = {
  reviewSingular: "Review",
  reviewPlural: "Reviews",
  reviewDetailTitle: "Review detail",
  goldenManifestLabel: "Approved design",
  authorityChainLabel: "Review steps",
  manifestSummaryHeading: "Approved design summary",
};

const GOVERNANCE_VOCABULARY: GovernanceModeVocabulary = {
  reviewSingular: "Review",
  reviewPlural: "Reviews",
  reviewDetailTitle: "Review detail",
  goldenManifestLabel: "Finalized review record",
  authorityChainLabel: "Authority chain",
  manifestSummaryHeading: "Finalized review record summary",
};

function applyBuyerVocabularyToGovernanceMode(vocabulary: GovernanceModeVocabulary): GovernanceModeVocabulary {
  if (!isBuyerVocabularyPassActive()) {
    return vocabulary;
  }

  return {
    reviewSingular: applyBuyerDemoVocabulary(vocabulary.reviewSingular),
    reviewPlural: applyBuyerDemoVocabulary(vocabulary.reviewPlural),
    reviewDetailTitle: applyBuyerDemoVocabulary(vocabulary.reviewDetailTitle),
    goldenManifestLabel: applyBuyerDemoVocabulary(vocabulary.goldenManifestLabel),
    authorityChainLabel: applyBuyerDemoVocabulary(vocabulary.authorityChainLabel),
    manifestSummaryHeading: applyBuyerDemoVocabulary(vocabulary.manifestSummaryHeading),
  };
}

export function governanceModeVocabulary(isGovernanceModeEnabled: boolean): GovernanceModeVocabulary {
  if (isGovernanceModeEnabled) {
    return applyBuyerVocabularyToGovernanceMode(GOVERNANCE_VOCABULARY);
  }

  return applyBuyerVocabularyToGovernanceMode(PILOT_VOCABULARY);
}
