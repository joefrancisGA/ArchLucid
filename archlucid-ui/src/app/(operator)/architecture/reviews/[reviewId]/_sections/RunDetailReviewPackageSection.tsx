import Link from "next/link";

import { cn } from "@/lib/utils";
import { PackagePrintOpenButton } from "@/components/reviews/PackagePrintOpenButton";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { REVIEW_DETAIL_TAB_LABELS } from "@/lib/review-detail-workspace-tabs";

export type RunDetailReviewPackageSectionProps = {
  readonly manifestId: string | null | undefined;
  readonly runId: string;
  readonly artifactCount: number;
  readonly findingCount: number | null;
  readonly showExportActions: boolean;
};

/** Review outputs when finalized; guidance when not. */
export function RunDetailReviewPackageSection(
  props: RunDetailReviewPackageSectionProps,
): React.JSX.Element {
  const finalized = (props.manifestId ?? "").trim().length > 0;

  return (
    <section
      id="review-package"
      className="scroll-mt-24 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="run-detail-review-package"
    >
      <h2 className={cn("m-0 mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100")}>
        {REVIEW_DETAIL_TAB_LABELS["review-package"]}
      </h2>
      {!finalized ? (
        <div className="space-y-3">
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Finalize the review to create the shareable review.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 print:hidden">
            <PackagePrintOpenButton runId={props.runId} />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            This review is finalized and available for export or sharing.
          </p>
          <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
            <li>Finalized review record</li>
            <li>Findings report ({props.findingCount ?? " — "} findings)</li>
            <li>Evidence bundle ({props.artifactCount} artifact{props.artifactCount === 1 ? "" : "s"})</li>
            <li>Decisions</li>
          </ul>
          <div className="flex flex-wrap gap-2 pt-1 print:hidden">
            <PackagePrintOpenButton runId={props.runId} />
            {props.showExportActions ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="#artifacts-exports">Export or share</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="#manifest-summary">View finalized record</Link>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
