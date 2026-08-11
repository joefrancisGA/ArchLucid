import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import {
  EVIDENCE_CLAIM_STYLE,
  EVIDENCE_SOURCES_STYLE,
  type EvidenceOrientationClaimStyle,
  type EvidenceOrientationSourcesStyle,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import { EVALUATION_SOURCES_TITLE } from "@/lib/evaluation-sources-title";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";

export type EvidenceOrientationSourcesAndClaimStripProps = {
  /**
   * Test-id stem. Defaults derive as `{slug}-orientation`, `{slug}-sources`, `{slug}-sources-heading`,
   * and `{slug}-claim-discipline`.
   */
  readonly slug: string;
  readonly sourcesIntro: string;
  readonly sources: readonly EvidenceOrientationLink[];
  /** Visible heading that states what the page does *not* claim, for example "Illustrative sample only". */
  readonly claimHeading: string;
  readonly claim: string;
  readonly sourcesTitle?: string;
  /** Page rhythm above or below the strip, for example `mb-10` between hero and first section. */
  readonly margin?: string;
  /** Alignment override for strips inside centred page sections. */
  readonly align?: string;
  readonly claimStyle?: EvidenceOrientationClaimStyle;
  readonly claimElement?: "aside" | "div";
  readonly sourcesStyle?: EvidenceOrientationSourcesStyle;
};

/**
 * Sources index followed by a headed claim-discipline band — the shape evaluation surfaces use
 * (marketing pages and pre-finalize architecture tabs), where follow-up reading leads and the
 * claim limit closes.
 */
export function EvidenceOrientationSourcesAndClaimStrip({
  slug,
  sourcesIntro,
  sources,
  claimHeading,
  claim,
  sourcesTitle = EVALUATION_SOURCES_TITLE,
  margin,
  align,
  claimStyle = EVIDENCE_CLAIM_STYLE.evaluationCaution,
  claimElement,
  sourcesStyle = EVIDENCE_SOURCES_STYLE.evaluationMuted,
}: EvidenceOrientationSourcesAndClaimStripProps): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId={`${slug}-orientation`} margin={margin} align={align}>
      <EvidenceOrientationSourcesSection
        testId={`${slug}-sources`}
        headingId={`${slug}-sources-heading`}
        title={sourcesTitle}
        intro={sourcesIntro}
        links={sources}
        style={sourcesStyle}
      />

      <EvidenceOrientationClaimCallout
        testId={`${slug}-claim-discipline`}
        body={claim}
        heading={{ text: claimHeading }}
        style={claimStyle}
        element={claimElement}
      />
    </EvidenceOrientationStripShell>
  );
}
