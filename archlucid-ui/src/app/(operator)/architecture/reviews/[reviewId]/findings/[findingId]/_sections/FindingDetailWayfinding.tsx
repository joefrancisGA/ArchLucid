import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingDetailWayfindingProps = {
  readonly reviewPackageHref: string;
  readonly reviewFindingsHref: string;
  readonly currentPageLabel: string;
};

/** Hierarchy back links + contextual help for finding detail (TB-2090: not a breadcrumb trail). */
export function FindingDetailWayfinding(props: FindingDetailWayfindingProps): React.JSX.Element | null {
  if (isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      data-testid="finding-detail-wayfinding"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href={props.reviewPackageHref} data-testid="finding-detail-back-to-review">
          Back to review
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.nav} href={props.reviewFindingsHref} data-testid="finding-detail-back-to-findings">
          Findings
        </Link>
        <span className="sr-only"> — {props.currentPageLabel}</span>
      </p>
      <PageContextualHelpButton />
    </div>
  );
}
