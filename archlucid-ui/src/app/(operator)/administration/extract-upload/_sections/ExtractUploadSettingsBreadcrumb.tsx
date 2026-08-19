import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import {
  EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_HREF,
  EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_ADMINISTRATION_LABEL,
  EXTRACT_UPLOAD_SETTINGS_BREADCRUMB_TOPIC_TITLE,
} from "@/lib/extract-upload-settings-page-copy";

/** Administration trail for the Extract & Upload workspace (ADX). */
export function ExtractUploadSettingsBreadcrumb(): React.JSX.Element {
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
