"use client";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import {
  ALERTS_INBOX_FOLLOW_UPS_TITLE,
  ALERTS_INBOX_SOURCES_INTRO,
  resolveAlertsInboxOrientationSources,
} from "@/lib/alerts-inbox-evidence-copy";

/** Claim discipline + Sources index for the approval alerts inbox (AL). */
export function AlertsInboxClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="alerts-inbox"
      sourcesTitle={ALERTS_INBOX_FOLLOW_UPS_TITLE}
      sourcesIntro={ALERTS_INBOX_SOURCES_INTRO}
      sources={resolveAlertsInboxOrientationSources(productLine)}
      hubSecondary
    />
  );
}
