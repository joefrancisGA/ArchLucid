import {
  EvidenceOrientationClaimCallout,
  type EvidenceOrientationCalloutTone,
} from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import {
  EvidenceOrientationSourcesSection,
  type EvidenceOrientationSourcesSurface,
} from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help-diligence-artifact-index";

export type EvidenceOrientationClaimAndSourcesStripProps = {
  /**
   * Test-id stem. Defaults derive as `{slug}-orientation`, `{slug}-claim-discipline`, `{slug}-sources`,
   * and `{slug}-sources-heading`; surfaces whose published ids predate that convention override below.
   */
  readonly slug: string;
  readonly claim: string;
  readonly sourcesIntro: string;
  readonly sources: readonly EvidenceOrientationLink[];
  readonly sourcesTitle?: string;
  readonly claimTone?: EvidenceOrientationCalloutTone;
  readonly claimElement?: "aside" | "div";
  readonly claimTestId?: string;
  readonly sourcesSurface?: EvidenceOrientationSourcesSurface;
  readonly sourcesHeadingId?: string;
  readonly sourcesTestId?: string;
  readonly stripTestId?: string;
};

/**
 * Claim-discipline band followed by a Sources index — the shape most evidence orientation strips use.
 * Surfaces needing extra bands (lead sentence, freshness line, bulleted scope) compose the underlying
 * primitives directly instead of extending this composite.
 */
export function EvidenceOrientationClaimAndSourcesStrip({
  slug,
  claim,
  sourcesIntro,
  sources,
  sourcesTitle = HELP_DILIGENCE_ARTIFACT_INDEX_TITLE,
  claimTone,
  claimElement,
  claimTestId,
  sourcesSurface,
  sourcesHeadingId,
  sourcesTestId,
  stripTestId,
}: EvidenceOrientationClaimAndSourcesStripProps): React.JSX.Element {
  return (
    <EvidenceOrientationStripShell testId={stripTestId ?? `${slug}-orientation`}>
      <EvidenceOrientationClaimCallout
        testId={claimTestId ?? `${slug}-claim-discipline`}
        body={claim}
        tone={claimTone}
        element={claimElement}
      />

      <EvidenceOrientationSourcesSection
        testId={sourcesTestId ?? `${slug}-sources`}
        headingId={sourcesHeadingId ?? `${slug}-sources-heading`}
        title={sourcesTitle}
        intro={sourcesIntro}
        links={sources}
        surface={sourcesSurface}
      />
    </EvidenceOrientationStripShell>
  );
}
