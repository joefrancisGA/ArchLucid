import { PatternLibraryBreadcrumb } from "@/components/insights/PatternLibraryBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import {
  PATTERN_LIBRARY_LOADING_STATUS,
  PATTERN_LIBRARY_PAGE_TITLE,
  patternLibraryPageSubtitle,
} from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_PATH } from "@/lib/pattern-library-route";

/** Structured navigation shell while the pattern-library client chunk loads. */
export default function PatternLibraryLoading() {
  return (
    <div
      className="max-w-6xl space-y-4"
      data-testid="pattern-library-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        navHref={PATTERN_LIBRARY_PATH}
        title={PATTERN_LIBRARY_PAGE_TITLE}
        titleTestId="pattern-library-page-title"
        subtitle={patternLibraryPageSubtitle(true)}
        breadcrumb={<PatternLibraryBreadcrumb />}
      />
      <p className="m-0 text-al-text-secondary">{PATTERN_LIBRARY_LOADING_STATUS}</p>
    </div>
  );
}
