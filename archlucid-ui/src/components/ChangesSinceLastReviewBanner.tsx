"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { OperatorWarningCallout } from "@/components/operator/OperatorShellMessage";
import type { ChangesSinceLastReviewCopy } from "@/lib/changes-since-last-review-summary";
import { BUYER_COMPARE_OPEN_FULL_LINK_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  changesSinceLastReviewDisclosureHrefFromSearch,
  parseChangesSinceLastReviewOpenFromSearch,
} from "@/lib/runs/changes-since-last-review-disclosure-url";

export type ChangesSinceLastReviewBannerProps = {
  readonly priorReviewDateLabel: string;
  readonly priorRunId: string;
  readonly currentRunId: string;
  readonly copy: ChangesSinceLastReviewCopy | null;
  readonly blockedReason?: string | null;
};

/** Collapsible read-only delta banner vs the prior committed review on the same project. */
export function ChangesSinceLastReviewBanner(props: ChangesSinceLastReviewBannerProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const changesSinceLastReviewOpenParam = searchParams.get("changesSinceLastReviewOpen");
  const [bannerOpen, setBannerOpenState] = useState(() =>
    parseChangesSinceLastReviewOpenFromSearch(changesSinceLastReviewOpenParam),
  );
  const compareHref = comparePageHrefAdaptive(props.priorRunId, props.currentRunId);
  const compareLinkLabel = isBuyerPolishedOperatorShellEnv()
    ? BUYER_COMPARE_OPEN_FULL_LINK_LABEL
    : "Open full comparison";
  const blockedReason = props.blockedReason?.trim() ?? "";

  const syncBannerOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(changesSinceLastReviewDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setBannerOpen = useCallback(
    (open: boolean) => {
      setBannerOpenState(open);
      syncBannerOpenToUrl(open);
    },
    [syncBannerOpenToUrl],
  );

  useEffect(() => {
    setBannerOpenState(parseChangesSinceLastReviewOpenFromSearch(changesSinceLastReviewOpenParam));
  }, [changesSinceLastReviewOpenParam]);


  if (blockedReason.length > 0) {
    return (
      <OperatorWarningCallout data-testid="changes-since-last-review-banner">
        <strong>Changes since your previous review on {props.priorReviewDateLabel} are unavailable.</strong>
        <p className={cn("mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{blockedReason}</p>
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Resolve lifecycle or sealed-manifest gaps on the prior review, then reload this page or open{" "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={compareHref}>
            {compareLinkLabel}
          </Link>{" "}
          after both reviews pass compare gates.
        </p>
      </OperatorWarningCallout>
    );
  }

  if (props.copy === null) {
    return <></>;
  }

  return (
    <details
      data-testid="changes-since-last-review-banner"
      className="group rounded-lg border border-neutral-200 bg-neutral-50/90 shadow-sm open:bg-white dark:border-neutral-800 dark:bg-neutral-950/40 dark:open:bg-neutral-950/30"
      open={bannerOpen}
      onToggle={(event) => {
        setBannerOpen(event.currentTarget.open);
      }}
    >
      <summary className={cn("flex cursor-pointer list-none items-start gap-2 px-4 py-3 font-semibold text-neutral-900 outline-none marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden", OPERATOR_TYPOGRAPHY.cardTitle)}>
        <DisclosureTriangleIndicator className="mt-0.5" />
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
