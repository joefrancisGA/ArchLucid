"use client";

import { OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID } from "@/app/(operator)/_sections/operator-home-page-surface-copy";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  OPERATOR_HOME_FOLLOW_UPS_TITLE,
  OPERATOR_HOME_ORIENTATION_SOURCES_INTRO,
  resolveOperatorHomeOrientationSources,
} from "@/lib/operator/operator-home-evidence-copy";

/** Sources-only follow-ups for `/` buyer-polished shell (HOM). */
export function OperatorHomeSourcesOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="operator-home-settings"
      stripTestId={OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID}
      sourcesTestId="operator-home-settings-sources"
      sourcesTitle={OPERATOR_HOME_FOLLOW_UPS_TITLE}
      sourcesIntro={OPERATOR_HOME_ORIENTATION_SOURCES_INTRO}
      sources={resolveOperatorHomeOrientationSources(productLine)}
      sourcesHeadingId="where-to-go-next"
      hubSecondary
    />
  );
}
