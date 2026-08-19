import { cn } from "@/lib/utils";
import {
  BUYER_ASK_GROUNDING_ONCE,
  BUYER_ASK_REVIEW_ANCHORS_LINE,
  BUYER_ASK_REVIEW_ANCHORS_SUMMARY,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type AskContextParagraphProps = {
  buyerPolishedShell: boolean;
  runId: string;
};

export function AskContextParagraph(props: AskContextParagraphProps) {
  const { buyerPolishedShell, runId } = props;

  return (
    <div className={cn("mb-4 max-w-3xl space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
      {buyerPolishedShell ? (
        <>
          <p className="m-0">{BUYER_ASK_GROUNDING_ONCE}</p>
          {canonicalizeDemoRunId(runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID ? (
            <details className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40">
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
