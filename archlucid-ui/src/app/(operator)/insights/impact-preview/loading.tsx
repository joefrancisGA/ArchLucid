import { ImpactPreviewBreadcrumb } from "@/components/insights/ImpactPreviewBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import {
  IMPACT_PREVIEW_LOADING_STATUS,
  IMPACT_PREVIEW_PAGE_TITLE,
  impactPreviewPageSubtitle,
} from "@/lib/impact-preview-page-copy";

/** Structured navigation shell while the impact-preview client chunk loads. */
export default function ImpactPreviewLoading() {
  return (
    <OperatorPageContainer
      variant="workflow"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="impact-preview-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        navHref={IMPACT_PREVIEW_PATH}
        title={IMPACT_PREVIEW_PAGE_TITLE}
        subtitle={impactPreviewPageSubtitle(true)}
        breadcrumb={<ImpactPreviewBreadcrumb />}
      />
      <p className="m-0 text-al-text-secondary">{IMPACT_PREVIEW_LOADING_STATUS}</p>
    </OperatorPageContainer>
  );
}
