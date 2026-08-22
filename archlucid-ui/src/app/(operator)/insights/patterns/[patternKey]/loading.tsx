import { PatternLibraryDetailBreadcrumb } from "@/components/insights/PatternLibraryDetailBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  PATTERN_LIBRARY_DETAIL_LOADING_STATUS,
  PATTERN_LIBRARY_DETAIL_PAGE_TITLE,
  patternLibraryPageSubtitle,
} from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";

/** Structured navigation shell while the pattern detail client chunk loads. */
export default function PatternLibraryDetailLoading() {
  return (
    <OperatorPageContainer
      variant="workflow"
      className="space-y-4"
      data-testid="pattern-library-detail-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        navHref={PATTERN_LIBRARY_PATH}
        title={PATTERN_LIBRARY_DETAIL_PAGE_TITLE}
        titleTestId="pattern-library-detail-title"
        subtitle={patternLibraryPageSubtitle(true)}
        breadcrumb={<PatternLibraryDetailBreadcrumb />}
      />
      <p className="m-0 text-al-text-secondary">{PATTERN_LIBRARY_DETAIL_LOADING_STATUS}</p>
    </OperatorPageContainer>
  );
}
