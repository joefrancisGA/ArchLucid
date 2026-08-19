import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import type { ReactElement } from "react";

import type { ChangesSinceLastReviewCopy } from "@/lib/changes-since-last-review-summary";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

export type ChangesSinceLastReviewBannerProps = {
  readonly priorReviewDateLabel: string;
  readonly priorRunId: string;
  readonly currentRunId: string;
  readonly copy: ChangesSinceLastReviewCopy;
};

/** Collapsible read-only delta banner vs the prior committed review on the same project. */
export function ChangesSinceLastReviewBanner(props: ChangesSinceLastReviewBannerProps): ReactElement {
  const compareHref = comparePageHrefAdaptive(props.priorRunId, props.currentRunId);
  const compareLinkLabel = isBuyerPolishedOperatorShellEnv()
    ? BUYER_COMPARE_OPEN_FULL_LINK_LABEL
    : "Open full comparison";

  return (
    <details
      data-testid="changes-since-last-review-banner"
      className="rounded-lg border border-neutral-200 bg-neutral-50/90 shadow-sm open:bg-white dark:border-neutral-800 dark:bg-neutral-950/40 dark:open:bg-neutral-950/30"
    >
      <summary className={cn("cursor-pointer list-none px-4 py-3 font-semibold text-neutral-900 outline-none marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden", OPERATOR_TYPOGRAPHY.cardTitle)}>
        <span className="underline-offset-2 hover:underline">
          Compared to your previous review on {props.priorReviewDateLabel}:
        </span>
        <span className="ml-2 font-normal text-neutral-600 dark:text-neutral-400">{props.copy.netChangeLine}</span>
      </summary>
      <div className={cn("space-y-3 border-t border-neutral-200 px-4 pb-4 pt-3 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {props.copy.severityShiftLine !== null ? (
          <p className="m-0 leading-relaxed">{props.copy.severityShiftLine}</p>
        ) : null}
        <p className="m-0">
          <Link
            href={compareHref}
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
          >
            {compareLinkLabel}
          </Link>
        </p>
      </div>
    </details>
  );
}
