"use client";

import { DigestsSubscriptionsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES } from "@/lib/digests-subscriptions-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

/** Buyer default: mount Sources orientation after primary Subscriptions workspace (AIS). */
export function DigestsSubscriptionsBuyerChrome(): React.JSX.Element | null {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div data-testid="digests-subscriptions-orientation-top">
      <DigestsSubscriptionsEvidenceOrientationStrip
        readingBodyClassName={HELP_PAGE_LAYOUT.readingBody}
        sources={DIGESTS_SUBSCRIPTIONS_ORIENTATION_SOURCES}
      />
    </div>
  );
}
