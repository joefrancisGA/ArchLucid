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

/**
 * Which bands a usage renders. Evaluation surfaces that show sample output split the strip: the
 * claim limit stays beside the sample it qualifies, while the Sources index moves to the page foot
 * where follow-up reading belongs. Surfaces with nothing misreadable render both bands together.
 */
export type EvidenceOrientationStripPart = "both" | "claim" | "sources";

export type EvidenceOrientationSourcesAndClaimStripProps = {
  /**
   * Test-id stem. Defaults derive as `{slug}-orientation`, `{slug}-sources`, `{slug}-sources-heading`,
   * and `{slug}-claim-discipline`. Split usages suffix the strip id as `{slug}-orientation-{part}`
   * so both halves can coexist on one page.
   */
  readonly slug: string;
  readonly part?: EvidenceOrientationStripPart;
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
 * Sources index plus a headed claim-discipline band — the shape evaluation surfaces use (marketing
 * pages and pre-finalize architecture tabs).
 *
 * Placement is the caller's decision, via `part`. The Sources index is a set of exit ramps, so it
 * belongs at the page foot: above the fold it asks a visitor to leave before they have read what
 * they came for, and on `/pricing` and `/get-started` it competes with the primary CTA. The claim
 * band is the opposite — on a surface rendering sample output it has to be read *before* the sample
 * is mistaken for a production result, so those pages render `part="claim"` up top and
 * `part="sources"` at the bottom.
 */
export function EvidenceOrientationSourcesAndClaimStrip({
  slug,
  part = "both",
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
  const stripTestId: string = part === "both" ? `${slug}-orientation` : `${slug}-orientation-${part}`;

  return (
    <EvidenceOrientationStripShell testId={stripTestId} margin={margin} align={align}>
      {part === "claim" ? null : (
        <EvidenceOrientationSourcesSection
          testId={`${slug}-sources`}
          headingId={`${slug}-sources-heading`}
          title={sourcesTitle}
          intro={sourcesIntro}
          links={sources}
          style={sourcesStyle}
        />
      )}

      {part === "sources" ? null : (
        <EvidenceOrientationClaimCallout
          testId={`${slug}-claim-discipline`}
          body={claim}
          heading={{ text: claimHeading }}
          style={claimStyle}
          element={claimElement}
        />
      )}
    </EvidenceOrientationStripShell>
  );
}
