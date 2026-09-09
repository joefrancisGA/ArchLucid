"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  BUYER_ASK_GROUNDING_ONCE,
  BUYER_ASK_REVIEW_ANCHORS_LINE,
  BUYER_ASK_REVIEW_ANCHORS_SUMMARY,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  ASK_REVIEW_ANCHORS_OPEN_PARAM,
  askReviewAnchorsDisclosureHrefFromSearch,
  parseAskReviewAnchorsOpenFromSearch,
} from "@/lib/insights/ask-review-anchors-disclosure-url";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type AskContextParagraphProps = {
  buyerPolishedShell: boolean;
  runId: string;
};

export function AskContextParagraph(props: AskContextParagraphProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const askReviewAnchorsParam = searchParams.get(ASK_REVIEW_ANCHORS_OPEN_PARAM);
  const [askReviewAnchorsOpen, setAskReviewAnchorsOpenState] = useState(() =>
    parseAskReviewAnchorsOpenFromSearch(askReviewAnchorsParam),
  );
  const syncAskReviewAnchorsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(askReviewAnchorsDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
  const setAskReviewAnchorsOpen = useCallback(
    (open: boolean) => {
      setAskReviewAnchorsOpenState(open);
      syncAskReviewAnchorsOpenToUrl(open);
    },
    [syncAskReviewAnchorsOpenToUrl],
  );
  const { buyerPolishedShell, runId } = props;

  useEffect(() => {
    setAskReviewAnchorsOpenState(parseAskReviewAnchorsOpenFromSearch(askReviewAnchorsParam));
  }, [askReviewAnchorsParam]);

  return (
    <div className={cn("mb-4 max-w-3xl space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
      {buyerPolishedShell ? (
        <>
          <p className="m-0">{BUYER_ASK_GROUNDING_ONCE}</p>
          {canonicalizeDemoRunId(runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID ? (
            <details
              className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40"
              open={askReviewAnchorsOpen}
              onToggle={(event) => setAskReviewAnchorsOpen(event.currentTarget.open)}
            >
              <summary className={cn("cursor-pointer text-al-text-primary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                {BUYER_ASK_REVIEW_ANCHORS_SUMMARY}
              </summary>
              <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {BUYER_ASK_REVIEW_ANCHORS_LINE}
              </p>
            </details>
          ) : null}
        </>
      ) : (
        <p className="m-0">
          Answers use the review context you select (finalized review and findings when available; reviews in progress may omit
          late-stage outputs until the pipeline completes).
        </p>
      )}
    </div>
  );
}
