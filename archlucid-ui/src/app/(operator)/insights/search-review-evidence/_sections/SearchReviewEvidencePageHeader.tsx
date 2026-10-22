"use client";

import { SearchReviewEvidenceBreadcrumb } from "@/components/insights/SearchReviewEvidenceBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";
import { SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE } from "@/lib/search-review-evidence-evidence-copy";

export type SearchReviewEvidencePageHeaderProps = {
  readonly title: string;
  readonly subtitle: string;
};

/** Shared `/insights/search-review-evidence` hero — breadcrumb, help, and buyer-safe subtitle. */
export function SearchReviewEvidencePageHeader(props: SearchReviewEvidencePageHeaderProps): React.JSX.Element {
  return (
    <>
      <SearchReviewEvidenceBreadcrumb />
      <OperatorPageHeader
        navHref={SEARCH_REVIEW_EVIDENCE_PATH}
        title={props.title}
        titleTestId="search-review-evidence-page-title"
        subtitle={props.subtitle}
        claimDiscipline={SEARCH_REVIEW_EVIDENCE_CLAIM_DISCIPLINE}
        claimDisciplineTestId="search-review-evidence-claim-discipline"
        actions={
          <div className="flex flex-wrap items-center gap-2" data-testid="search-review-evidence-header-actions">
            <PageContextualHelpButton />
          </div>
        }
      />
    </>
  );
}
