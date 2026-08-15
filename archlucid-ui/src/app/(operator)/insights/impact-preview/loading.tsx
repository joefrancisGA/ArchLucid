import { ImpactPreviewBreadcrumb } from "@/components/insights/ImpactPreviewBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import {
  IMPACT_PREVIEW_LOADING_STATUS,
  IMPACT_PREVIEW_PAGE_TITLE,
  impactPreviewPageSubtitle,
} from "@/lib/impact-preview-page-copy";

/** Structured navigation shell while the impact-preview client chunk loads. */
export default function ImpactPreviewLoading() {
  return (
    <div
      className="max-w-5xl space-y-4"
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
    </div>
  );
}
