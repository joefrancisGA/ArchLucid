"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  BUYER_ASK_REVIEW_ANCHORS_LINE,
  BUYER_ASK_REVIEW_ANCHORS_SUMMARY,
  BUYER_ASK_SCOPE_PREFIX,
  BUYER_COMPARE_OPEN_FULL_LINK_LABEL,
  BUYER_OPEN_SIGNED_RECORD_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer/buyer-facing-review-title";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { getShowcaseCompareHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import {
  askReviewAnchorsDisclosureHrefFromSearch,
  parseAskReviewAnchorsOpenFromSearch,
} from "@/lib/insights/ask-review-anchors-disclosure-url";

export type AskReviewScopeStripProps = {
  readonly runId: string;
  readonly buyerPolishedShell: boolean;
  readonly clearScopeHref?: string;
};

/** Compact review context above the question input. */
export function AskReviewScopeStrip(props: AskReviewScopeStripProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const askReviewAnchorsOpenParam = searchParams.get("askReviewAnchorsOpen");
  const [anchorsOpen, setAnchorsOpenState] = useState(() =>
    parseAskReviewAnchorsOpenFromSearch(askReviewAnchorsOpenParam),
  );
  const trimmed = props.runId.trim();

  const syncAnchorsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(askReviewAnchorsDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setAnchorsOpen = useCallback(
    (open: boolean) => {
      setAnchorsOpenState(open);
      syncAnchorsOpenToUrl(open);
    },
    [syncAnchorsOpenToUrl],
  );

  useEffect(() => {
    setAnchorsOpenState(parseAskReviewAnchorsOpenFromSearch(askReviewAnchorsOpenParam));
  }, [askReviewAnchorsOpenParam]);

  if (!props.buyerPolishedShell || trimmed.length === 0) {
    return null;
  }

  const canonical = canonicalizeDemoRunId(trimmed);
  const packageLabel = buyerFacingReviewLinkLabelFromRunId(trimmed);
  const isShowcase = canonical === SHOWCASE_STATIC_DEMO_RUN_ID;

  return (
    <div className="space-y-2" data-testid="ask-review-scope-strip">
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-medium text-al-text-secondary">{BUYER_ASK_SCOPE_PREFIX}</span>{" "}
        {packageLabel}
      </p>
      <p className={cn("m-0 flex flex-wrap gap-x-3 gap-y-1", OPERATOR_TYPOGRAPHY.helper)}>
        {props.clearScopeHref !== undefined ? (
          <Link className={OPERATOR_LINK.nav} href={props.clearScopeHref}>
            Clear review scope
          </Link>
        ) : null}
        <Link className={OPERATOR_LINK.nav} href={`/architecture/reviews/${encodeURIComponent(canonical)}`}>
          Open review
        </Link>
        {isShowcase ? (
          <>
            <Link
              className={OPERATOR_LINK.nav}
              href={signedRecordDetailPath(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}
            >
              {BUYER_OPEN_SIGNED_RECORD_CTA}
            </Link>
            <Link className={OPERATOR_LINK.nav} href={getShowcaseCompareHref()}>
              {BUYER_COMPARE_OPEN_FULL_LINK_LABEL}
            </Link>
          </>
        ) : null}
      </p>
      {isShowcase ? (
        <details
          className="rounded-md border border-neutral-200/80 bg-neutral-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30"
          open={anchorsOpen}
          onToggle={(event) => {
            setAnchorsOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
            {BUYER_ASK_REVIEW_ANCHORS_SUMMARY}
          </summary>
          <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {BUYER_ASK_REVIEW_ANCHORS_LINE}
          </p>
        </details>
      ) : null}
    </div>
  );
}
