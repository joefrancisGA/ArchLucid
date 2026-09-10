"use client";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_HREF,
  EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
  EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/extract-upload-settings-page-copy";
import { isExtractUploadSettingsRoutePath } from "@/lib/extract-upload-settings-route";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { usePathname } from "next/navigation";

/** Administration or Infrastructure trail for the Extract & Upload workspace (ADX). */
export function ExtractUploadSettingsBreadcrumb(): React.JSX.Element {
  const pathname = usePathname();
  const isInfrastructureRoute = isExtractUploadSettingsRoutePath(pathname)
    && pathname?.startsWith(GOVERNANCE_INFRASTRUCTURE_PATH);

  if (isInfrastructureRoute) {
    return (
      <OperatorPageBreadcrumb
        data-testid="extract-upload-page-breadcrumb"
        items={[
          {
            label: GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
            href: GOVERNANCE_INFRASTRUCTURE_PATH,
          },
          { label: EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_TOPIC_TITLE },
        ]}
      />
    );
  }

  return (
    <OperatorPageBreadcrumb
      data-testid="extract-upload-page-breadcrumb"
      items={[
        {
          label: EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
          href: EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_HREF,
        },
        { label: EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_TOPIC_TITLE },
      ]}
    />
  );
}

