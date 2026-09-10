"use client";

import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { StatusTag } from "@/components/ui/status-tag";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { PageShortcutsDisclosure } from "@/components/usability/PageShortcutsDisclosure";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { EXTRACT_UPLOAD_PAGE_SHORTCUTS } from "@/lib/extract-upload-page-shortcuts";
import {
  EXTRACT_UPLOAD_EXTRACTOR_VERSION_METADATA_PREFIX,
  EXTRACT_UPLOAD_INVENTORY_CHECKING_STATUS_LABEL,
  EXTRACT_UPLOAD_INVENTORY_ON_FILE_STATUS_LABEL,
  EXTRACT_UPLOAD_NO_INVENTORY_STATUS_LABEL,
  EXTRACT_UPLOAD_REVIEW_BINDING_NONE,
  EXTRACT_UPLOAD_REVIEW_BINDING_PREFIX,
  EXTRACT_UPLOAD_SETTINGS_NAV_HREF,
  EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE,
  extractUploadSettingsPageSubtitle,
} from "@/lib/extract-upload-settings-page-copy";
import { truncateExtractUploadPackageId } from "@/lib/extract-upload-accepted-package-record";
import { cn } from "@/lib/utils";

import { ExtractUploadSettingsBreadcrumb } from "./ExtractUploadSettingsBreadcrumb";

export type ExtractUploadSettingsPageHeaderProps = {
  readonly baselineLoading: boolean;
  readonly hasInventoryOnFile: boolean | null;
  readonly extractorScriptVersion: string | null;
  readonly associateRunId: string | null;
};

function inventoryStatusPresentation(
  baselineLoading: boolean,
  hasInventoryOnFile: boolean | null,
): { kind: EnterpriseStatusKind; label: string } | null {
  if (baselineLoading && hasInventoryOnFile !== true) {
    return { kind: "in-progress", label: EXTRACT_UPLOAD_INVENTORY_CHECKING_STATUS_LABEL };
  }

  if (hasInventoryOnFile === true) {
    return { kind: "ready", label: EXTRACT_UPLOAD_INVENTORY_ON_FILE_STATUS_LABEL };
  }

  if (hasInventoryOnFile === false) {
    return { kind: "needs-attention", label: EXTRACT_UPLOAD_NO_INVENTORY_STATUS_LABEL };
  }

  return null;
}

function reviewBindingLabel(associateRunId: string | null): string {
  const trimmed = associateRunId?.trim() ?? "";

  if (trimmed.length === 0) {
    return EXTRACT_UPLOAD_REVIEW_BINDING_NONE;
  }

  return `${EXTRACT_UPLOAD_REVIEW_BINDING_PREFIX} ${truncateExtractUploadPackageId(trimmed, 12)}`;
}

export function ExtractUploadSettingsPageHeader(
  props: ExtractUploadSettingsPageHeaderProps,
): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const inventoryStatus = inventoryStatusPresentation(props.baselineLoading, props.hasInventoryOnFile);

  return (
    <OperatorPageHeader
      title={EXTRACT_UPLOAD_SETTINGS_PAGE_TITLE}
      titleTestId="extract-upload-page-title"
      navHref={EXTRACT_UPLOAD_SETTINGS_NAV_HREF}
      headingLevel="h1"
      breadcrumb={buyerPolishedShell ? <ExtractUploadSettingsBreadcrumb /> : undefined}
      subtitle={extractUploadSettingsPageSubtitle(buyerPolishedShell)}
      subtitleClassName={buyerPolishedShell ? HELP_PAGE_LAYOUT.readingBody : undefined}
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
        buyerPolishedShell ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <PageShortcutsDisclosure
              testId="extract-upload-page-shortcuts"
              entries={EXTRACT_UPLOAD_PAGE_SHORTCUTS}
            />
            <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
          </div>
        )
      }
      metadata={
        buyerPolishedShell ? null : (
          <div className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.helper)}>
            {props.extractorScriptVersion !== null ? (
              <span className="text-al-text-secondary" data-testid="extract-upload-header-extractor-version">
                {EXTRACT_UPLOAD_EXTRACTOR_VERSION_METADATA_PREFIX}: v{props.extractorScriptVersion}
              </span>
            ) : null}
            <span className="text-al-text-secondary" data-testid="extract-upload-header-review-binding">
              {reviewBindingLabel(props.associateRunId)}
            </span>
          </div>
        )
      }
    />
  );
}
