"use client";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { StatusTag } from "@/components/ui/status-tag";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  EXTRACT_UPLOAD_EXTRACTOR_VERSION_METADATA_PREFIX,
  EXTRACT_UPLOAD_INVENTORY_CHECKING_STATUS_LABEL,
  EXTRACT_UPLOAD_INVENTORY_ON_FILE_STATUS_LABEL,
  EXTRACT_UPLOAD_NO_INVENTORY_STATUS_LABEL,
  EXTRACT_UPLOAD_SETTINGS_NAV_HREF,
  EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE,
  extractUploadSettingsPageSubtitle,
} from "@/lib/extract-upload-settings-page-copy";
import { cn } from "@/lib/utils";

import { ExtractUploadSettingsBreadcrumb } from "./ExtractUploadSettingsBreadcrumb";

export type ExtractUploadSettingsPageHeaderProps = {
  readonly baselineLoading: boolean;
  readonly hasBaselineArtifacts: boolean | null;
  readonly extractorScriptVersion: string | null;
};

function inventoryStatusPresentation(
  baselineLoading: boolean,
  hasBaselineArtifacts: boolean | null,
): { kind: EnterpriseStatusKind; label: string } | null {
  if (baselineLoading) {
    return { kind: "in-progress", label: EXTRACT_UPLOAD_INVENTORY_CHECKING_STATUS_LABEL };
  }

  if (hasBaselineArtifacts === true) {
    return { kind: "ready", label: EXTRACT_UPLOAD_INVENTORY_ON_FILE_STATUS_LABEL };
  }

  if (hasBaselineArtifacts === false) {
    return { kind: "needs-attention", label: EXTRACT_UPLOAD_NO_INVENTORY_STATUS_LABEL };
  }

  return null;
}

export function ExtractUploadSettingsPageHeader(
  props: ExtractUploadSettingsPageHeaderProps,
): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const inventoryStatus = inventoryStatusPresentation(props.baselineLoading, props.hasBaselineArtifacts);

  return (
    <OperatorPageHeader
      title={EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE}
      titleTestId="extract-upload-page-title"
      navHref={EXTRACT_UPLOAD_SETTINGS_NAV_HREF}
      headingLevel="h1"
      breadcrumb={buyerPolishedShell ? <ExtractUploadSettingsBreadcrumb /> : undefined}
      subtitle={extractUploadSettingsPageSubtitle(buyerPolishedShell)}
      statusBadge={
        inventoryStatus !== null ? (
          <StatusTag
            kind={inventoryStatus.kind}
            label={inventoryStatus.label}
            data-testid="extract-upload-header-inventory-status"
          />
        ) : null
      }
      actions={
        <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
      }
      metadata={
        buyerPolishedShell || props.extractorScriptVersion === null ? null : (
          <span
            className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="extract-upload-header-extractor-version"
          >
            {EXTRACT_UPLOAD_EXTRACTOR_VERSION_METADATA_PREFIX}: v{props.extractorScriptVersion}
          </span>
        )
      }
    />
  );
}
