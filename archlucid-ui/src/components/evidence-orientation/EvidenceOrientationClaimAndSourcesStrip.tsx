"use client";

import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EvidenceOrientationSourcesSection } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";
import { EvidenceOrientationStripShell } from "@/components/evidence-orientation/EvidenceOrientationStripShell";
import {
  EVIDENCE_SOURCES_STYLE,
  type EvidenceOrientationClaimStyle,
  type EvidenceOrientationSourcesStyle,
} from "@/components/evidence-orientation/evidence-orientation-styles";
import { useWhereToGoNextVisible } from "@/components/WhereToGoNextPreferenceProvider";
import { resolveClaimDisciplineForStrip } from "@/lib/claim-discipline-policy";
import type { EvidenceOrientationLink } from "@/lib/evidence-surface-copy";
import { HUB_SECONDARY_SOURCES_LAYOUT } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import { HELP_DILIGENCE_ARTIFACT_INDEX_TITLE } from "@/lib/help/help-diligence-artifact-index";
import type { EvidenceOrientationSourcesLayout } from "@/components/evidence-orientation/EvidenceOrientationSourcesSection";

export type EvidenceOrientationClaimAndSourcesStripProps = {
  /**
   * Test-id stem. Defaults derive as `{slug}-orientation`, `{slug}-claim-discipline`, `{slug}-sources`,
   * and `{slug}-sources-heading`; surfaces whose published ids predate that convention override below.
   */
  readonly slug: string;
  /**
   * Claim-discipline body. Omit on surfaces whose header already states scope — those render a
   * sources-only strip rather than a band that restates the subtitle.
   */
  readonly claim?: string;
  /** Optional visible heading for the claim band (for example "What AI usage is not"). */
  readonly claimHeading?: string;
  /** Stable anchor id; defaults to `{slug}-claim-discipline-heading`. */
  readonly claimHeadingId?: string;
  readonly sourcesIntro: string;
  readonly sources: readonly EvidenceOrientationLink[];
  readonly sourcesTitle?: string;
  readonly claimStyle?: EvidenceOrientationClaimStyle;
  readonly claimElement?: "aside" | "div";
  readonly claimTestId?: string;
  readonly sourcesStyle?: EvidenceOrientationSourcesStyle;
  readonly sourcesHeadingId?: string;
  readonly sourcesTestId?: string;
  readonly sourcesLayout?: EvidenceOrientationSourcesLayout;
  /** Hub pages below primary workspace — defaults sourcesLayout to wrap when sourcesLayout is omitted. */
  readonly hubSecondary?: boolean;
  /** Optional body scale for claim + sources list — help specialty guides pass readingBody. */
  readonly readingBodyClassName?: string;
  /** Optional heading scale for claim + sources h2 bands — help specialty guides pass sectionTitle. */
  readonly headingClassName?: string;
  readonly stripTestId?: string;
  /** Help topic strips default true so follow-up links prefix Read vs Open. */
  readonly distinguishFollowUpDestinations?: boolean;
  readonly promotedSourceHref?: string;
};

/**
 * Claim-discipline band followed by a Sources index — the shape operator help strips use.
 * Surfaces needing extra bands (lead sentence, freshness line, bulleted scope) compose the underlying
 * primitives directly instead of extending this composite.
 *
 * `claimElement`, `sourcesStyle`, and `sourcesLayout` default to that operator preset rather than
 * to the leaf-primitive defaults, which are tuned for marketing bands. Surfaces wanting the leaf
 * look pass `"aside"` / `operatorMuted` / `"wrap"` explicitly.
 */
export function EvidenceOrientationClaimAndSourcesStrip({
  slug,
  claim,
  claimHeading,
  claimHeadingId,
  sourcesIntro,
  sources,
  sourcesTitle = HELP_DILIGENCE_ARTIFACT_INDEX_TITLE,
  claimStyle,
  claimElement = "div",
  claimTestId,
  sourcesStyle = EVIDENCE_SOURCES_STYLE.operatorRaised,
  sourcesHeadingId,
  sourcesTestId,
  sourcesLayout,
  hubSecondary = false,
  readingBodyClassName,
  headingClassName,
  stripTestId,
  distinguishFollowUpDestinations = slug.startsWith("help-"),
  promotedSourceHref,
}: EvidenceOrientationClaimAndSourcesStripProps): React.JSX.Element | null {
  const whereToGoNextVisible = useWhereToGoNextVisible();
  const resolvedClaim: string | undefined = resolveClaimDisciplineForStrip(slug, claim);
  const resolvedSourcesLayout: EvidenceOrientationSourcesLayout =
    sourcesLayout ?? (hubSecondary ? HUB_SECONDARY_SOURCES_LAYOUT : "stacked");

  if (!whereToGoNextVisible && resolvedClaim === undefined) {
    return null;
  }

  return (
    <EvidenceOrientationStripShell testId={stripTestId ?? `${slug}-orientation`}>
      {resolvedClaim === undefined ? null : (
        <EvidenceOrientationClaimCallout
          testId={claimTestId ?? `${slug}-claim-discipline`}
          stripSlug={slug}
          body={resolvedClaim}
          style={claimStyle}
          element={claimElement}
          bodyClassName={readingBodyClassName}
          headingClassName={headingClassName}
          heading={
            claimHeading === undefined
              ? undefined
              : {
                  text: claimHeading,
                  id: claimHeadingId ?? `${slug}-claim-discipline-heading`,
                }
          }
        />
      )}

      <EvidenceOrientationSourcesSection
        testId={sourcesTestId ?? `${slug}-sources`}
        headingId={sourcesHeadingId ?? `${slug}-sources-heading`}
        title={sourcesTitle}
        intro={sourcesIntro}
        links={sources}
        style={sourcesStyle}
        layout={resolvedSourcesLayout}
        listClassName={readingBodyClassName}
        headingClassName={headingClassName}
        distinguishFollowUpDestinations={distinguishFollowUpDestinations}
        promotedSourceHref={promotedSourceHref}
      />
    </EvidenceOrientationStripShell>
  );
}
