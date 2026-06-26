import Link from "next/link";

import { getShowcaseCompareHref } from "@/lib/buyer-safe-review-navigation";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL, BUYER_OPEN_SIGNED_RECORD_CTA } from "@/lib/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type AskBuyerRunAnchorsProps = {
  buyerPolishedShell: boolean;
  runId: string;
};

export function AskBuyerRunAnchors(props: AskBuyerRunAnchorsProps) {
  const { buyerPolishedShell, runId } = props;
  const trimmed = runId.trim();

  if (!buyerPolishedShell || trimmed.length === 0) {
    return null;
  }

  const canonical = canonicalizeDemoRunId(trimmed);

  return (
    <p className={cn("m-0 flex flex-wrap gap-x-4 gap-y-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
      <Link className={OPERATOR_LINK.nav} href={`/reviews/${encodeURIComponent(canonical)}`}>
        Open review package
      </Link>
      {canonical === SHOWCASE_STATIC_DEMO_RUN_ID ? (
        <>
          <Link className={OPERATOR_LINK.nav} href={`/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`}>
            {BUYER_OPEN_SIGNED_RECORD_CTA}
          </Link>
          <Link className={OPERATOR_LINK.nav} href={getShowcaseCompareHref()}>
            {BUYER_COMPARE_OPEN_FULL_LINK_LABEL} — baseline vs. updated
          </Link>
        </>
      ) : null}
    </p>
  );
}
