"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  API_KEYS_RESTRICTED_TITLE,
  API_KEYS_SURFACE_DISABLED_TITLE,
} from "@/lib/api-keys-settings-copy";
import {
  API_KEYS_FORBIDDEN_EMPTY_COMPACT,
  API_KEYS_SURFACE_DISABLED_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

import { ApiKeysSettingsBreadcrumb } from "./ApiKeysSettingsBreadcrumb";
import { ApiKeysSettingsBuyerChrome } from "./ApiKeysSettingsBuyerChrome";
import {
  API_KEYS_SETTINGS_PRIMARY_CONTENT_ID,
  API_KEYS_SETTINGS_SKIP_LINK_LABEL,
} from "./api-keys-settings-page-copy";

export type ApiKeysSettingsRestrictedStateProps = {
  readonly reason: "forbidden" | "surface_disabled";
};

function resolveRestrictedTitle(reason: ApiKeysSettingsRestrictedStateProps["reason"]): string {
  if (reason === "surface_disabled") {
    return API_KEYS_SURFACE_DISABLED_TITLE;
  }

  return API_KEYS_RESTRICTED_TITLE;
}

function resolveRestrictedEmptyCompact(reason: ApiKeysSettingsRestrictedStateProps["reason"]) {
  if (reason === "surface_disabled") {
    return API_KEYS_SURFACE_DISABLED_EMPTY_COMPACT;
  }

  return API_KEYS_FORBIDDEN_EMPTY_COMPACT;
}

export function ApiKeysSettingsRestrictedState(props: ApiKeysSettingsRestrictedStateProps): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const emptyCompact = resolveRestrictedEmptyCompact(props.reason);

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="api-keys-settings-restricted">
      <a
        href={`#${API_KEYS_SETTINGS_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {API_KEYS_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={API_KEYS_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid="api-keys-settings-primary-content"
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          title={resolveRestrictedTitle(props.reason)}
          headingLevel="h1"
          titleTestId="api-keys-settings-restricted-title"
          breadcrumb={buyerPolishedShell ? <ApiKeysSettingsBreadcrumb /> : undefined}
          actions={<PageContextualHelpButton />}
        />

        <ApiKeysSettingsBuyerChrome />

        <EnterpriseCompactEmptyState
          title={emptyCompact.title}
          description={emptyCompact.description}
          actions={emptyCompact.actions}
          testId={emptyCompact.testId}
        />
      </div>
    </OperatorPageContainer>
  );
}
