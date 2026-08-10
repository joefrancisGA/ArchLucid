import Link from "next/link";

import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type ProvenanceWayfindingProps = {
  readonly reviewPackageHref: string;
};

/** Hierarchy back link + contextual help for run provenance (TB-2090: not a breadcrumb trail). */
export function ProvenanceWayfinding(props: ProvenanceWayfindingProps): React.JSX.Element {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
      data-testid="provenance-wayfinding"
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <Link
          className={OPERATOR_LINK.nav}
          href={props.reviewPackageHref}
          data-testid="provenance-back-to-review"
        >
          Back to review
        </Link>
      </p>
      <PageContextualHelpButton />
    </div>
  );
}
