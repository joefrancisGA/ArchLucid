import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  FINDING_DETAIL_FOLLOW_UPS_TITLE,
  FINDING_DETAIL_SOURCES_INTRO,
  buildFindingDetailOrientationSources,
} from "@/lib/findings/finding-detail-evidence-copy";
import {
  HELP_PAGE_LAYOUT,
} from "@/lib/help/help-page-layout";



export type FindingDetailClaimOrientationStripProps = {
  readonly runId: string;
  readonly findingId: string;
  readonly readingBodyClassName?: string;
};

/** Claim discipline + Sources index for finding detail (RRF). */
export function FindingDetailClaimOrientationStrip(
  props: FindingDetailClaimOrientationStripProps,
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="finding-detail"
      stripTestId="finding-detail-orientation"
      sourcesTestId="finding-detail-sources"
      sourcesTitle={FINDING_DETAIL_FOLLOW_UPS_TITLE}
      sourcesIntro={FINDING_DETAIL_SOURCES_INTRO}
      sources={buildFindingDetailOrientationSources(props.runId, props.findingId)}
      sourcesHeadingId="where-to-go-next"
      readingBodyClassName={props.readingBodyClassName ?? HELP_PAGE_LAYOUT.readingBody}
    />
  );
}
