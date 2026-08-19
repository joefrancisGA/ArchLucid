"use client";

import { SearchReviewEvidenceBreadcrumb } from "@/components/insights/SearchReviewEvidenceBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { SEARCH_REVIEW_EVIDENCE_PATH } from "@/lib/search-review-evidence-route";

export type SearchReviewEvidencePageHeaderProps = {
  readonly title: string;
  readonly subtitle: string;
};

/** Shared `/insights/search-review-evidence` hero — breadcrumb, help, and buyer-safe subtitle. */
export function SearchReviewEvidencePageHeader(props: SearchReviewEvidencePageHeaderProps): React.JSX.Element {
  return (
    <OperatorPageHeader
      navHref={SEARCH_REVIEW_EVIDENCE_PATH}
      title={props.title}
      titleTestId="search-review-evidence-page-title"
      subtitle={props.subtitle}
      breadcrumb={<SearchReviewEvidenceBreadcrumb />}
      actions={
        <div className="flex flex-wrap items-center gap-2" data-testid="search-review-evidence-header-actions">
          <PageContextualHelpButton />
        </div>
      }
    />
  );
}
