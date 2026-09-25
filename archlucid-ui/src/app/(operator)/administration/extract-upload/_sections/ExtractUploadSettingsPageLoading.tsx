"use client";

import { usePathname } from "next/navigation";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { OPERATOR_LAYOUT, OPERATOR_PAGE_CONTAINER } from "@/lib/design-tokens";
import {
  EXTRACT_UPLOAD_SETTINGS_PAGE_LOADING_SUBTITLE,
  EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE,
} from "@/lib/extract-upload-settings-page-copy";
import { extractUploadSettingsNavHrefForPath } from "@/lib/extract-upload-settings-route";
import { cn } from "@/lib/utils";

/** Shared loading chrome for extract-upload routes that hydrate URL search params on the client. */
export function ExtractUploadSettingsPageLoading(): React.JSX.Element {
  const pathname = usePathname();
  const navHref = extractUploadSettingsNavHrefForPath(pathname);

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
        navHref={navHref}
        headingLevel="h1"
        subtitle={EXTRACT_UPLOAD_SETTINGS_PAGE_LOADING_SUBTITLE}
      />

      <div className="space-y-4 rounded-md border border-al-border p-4" data-testid="extract-upload-settings-loading-skeleton">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
