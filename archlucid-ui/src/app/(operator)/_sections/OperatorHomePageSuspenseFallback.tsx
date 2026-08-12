import { OperatorHomeRunsDashboardListSkeleton } from "@/components/operator-home/OperatorHomeRunsDashboardListSkeleton";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OPERATOR_HOME_PRIMARY_SECTION_HEADING,
  OPERATOR_LAYOUT,
} from "@/lib/design-tokens";
import { OPERATOR_HOME_PAGE_TITLE } from "@/lib/operator/operator-home-page-copy";
import { OPERATOR_HOME_RECENT_REVIEWS_HEADING } from "@/lib/operator/operator-home-recent-reviews-heading";

/**
 * Compact enterprise placeholder while the Overview dashboard RSC streams in.
 * Mirrors header + recent-reviews stack spacing (Carbon-ish) without waiting on runs data.
 */
export function OperatorHomePageSuspenseFallback(): React.JSX.Element {
  return (
    <OperatorPageContainer
      variant="dashboard"
      className={OPERATOR_LAYOUT.majorSectionGap}
      data-testid="operator-home-page-suspense-fallback"
      aria-busy="true"
      aria-label="Loading overview"
      role="status"
    >
      <OperatorPageHeader title={OPERATOR_HOME_PAGE_TITLE} headingLevel="h1">
        <Skeleton className="h-4 w-full max-w-xl" />
      </OperatorPageHeader>

      <section
        aria-labelledby="operator-home-reviews-heading-skeleton"
        className={OPERATOR_LAYOUT.sectionHeadingStack}
      >
        <h2 id="operator-home-reviews-heading-skeleton" className={OPERATOR_HOME_PRIMARY_SECTION_HEADING}>
          {OPERATOR_HOME_RECENT_REVIEWS_HEADING}
        </h2>
        <OperatorHomeRunsDashboardListSkeleton />
      </section>

      <div className="space-y-3" aria-hidden="true">
        <Skeleton className="h-24 w-full max-w-3xl rounded-md" />
        <Skeleton className="h-16 w-full max-w-2xl rounded-md" />
      </div>
    </OperatorPageContainer>
  );
}
