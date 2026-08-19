import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  PACKAGE_PRINT_CLAIM_DISCIPLINE,
  PACKAGE_PRINT_SOURCES_INTRO,
  buildPackagePrintSources,
} from "@/lib/package-print-evidence-copy";
import { PACKAGE_PRINT_CLAIM_HEADING } from "@/lib/package-print-page-copy";

export type PackagePrintClaimOrientationStripProps = {
  readonly runId: string;
};

/** Claim discipline + Sources index for package print (APR). */
export function PackagePrintClaimOrientationStrip(
  props: PackagePrintClaimOrientationStripProps,
): React.JSX.Element {
  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="package-print"
      stripTestId="package-print-orientation"
      claim={PACKAGE_PRINT_CLAIM_DISCIPLINE}
      claimHeading={PACKAGE_PRINT_CLAIM_HEADING}
      sourcesIntro={PACKAGE_PRINT_SOURCES_INTRO}
      sources={buildPackagePrintSources(props.runId)}
    />
  );
}
