import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type FindingDetailWayfindingProps = {
  readonly reviewPackageHref: string;
  readonly reviewFindingsHref: string;
  readonly currentPageLabel: string;
};

/** Breadcrumb trail and contextual help for finding detail — replaces flat duplicate nav links. */
export function FindingDetailWayfinding(props: FindingDetailWayfindingProps): React.JSX.Element {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      data-testid="finding-detail-wayfinding"
    >
      <nav aria-label="Breadcrumb" className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link className={OPERATOR_LINK.nav} href={props.reviewPackageHref}>
          Review
        </Link>
        {" · "}
        <Link className={OPERATOR_LINK.nav} href={props.reviewFindingsHref}>
          Findings
        </Link>
        {" · "}
        <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} aria-current="page">
          {props.currentPageLabel}
        </span>
      </nav>
      <PageContextualHelpButton />
    </div>
  );
}
