import { cn } from "@/lib/utils";
import Link from "next/link";

import { getShowcaseCompareHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL, BUYER_OPEN_SIGNED_RECORD_CTA } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
      <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${encodeURIComponent(canonical)}`}>
        Open review
      </Link>
      {canonical === SHOWCASE_STATIC_DEMO_RUN_ID ? (
        <>
          <Link className={OPERATOR_LINK.nav} href={signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}>
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
