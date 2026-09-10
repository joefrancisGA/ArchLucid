import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_LAYOUT, OPERATOR_PAGE_CONTAINER, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  EXTRACT_UPLOAD_SETTINGS_NAV_HREF,
  EXTRACT_UPLOAD_SETTINGS_PAGE_LOADING_SUBTITLE,
  EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE,
} from "@/lib/extract-upload-settings-page-copy";
import { cn } from "@/lib/utils";

/** Shared loading chrome for extract-upload routes that hydrate URL search params on the client. */
export function ExtractUploadSettingsPageLoading(): React.JSX.Element {
  return (
    <div
      className={cn(OPERATOR_PAGE_CONTAINER.base, OPERATOR_PAGE_CONTAINER.variant.workflow, OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="extract-upload-settings-page-loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        title={EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE}
        titleTestId="extract-upload-page-title"
        navHref={EXTRACT_UPLOAD_SETTINGS_NAV_HREF}
        headingLevel="h1"
        subtitle={EXTRACT_UPLOAD_SETTINGS_PAGE_LOADING_SUBTITLE}
      />

      <div className="space-y-4 rounded-md border border-al-border p-4" data-testid="extract-upload-settings-loading-skeleton">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>

      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {EXTRACT_UPLOAD_SETTINGS_PAGE_LOADING_SUBTITLE}
      </p>
    </div>
  );
}
