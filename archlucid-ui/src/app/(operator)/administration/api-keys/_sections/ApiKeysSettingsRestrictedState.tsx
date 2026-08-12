"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  API_KEYS_PAGE_TITLE,
  API_KEYS_RESTRICTED_TITLE,
  API_KEYS_SURFACE_DISABLED_TITLE,
} from "@/lib/api-keys-settings-copy";
import {
  API_KEYS_FORBIDDEN_EMPTY_COMPACT,
  API_KEYS_SURFACE_DISABLED_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

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
  const emptyCompact = resolveRestrictedEmptyCompact(props.reason);

  return (
    <OperatorPageContainer variant="settings" className="space-y-6" data-testid="api-keys-settings-restricted">
      <OperatorPageHeader
        title={resolveRestrictedTitle(props.reason)}
        headingLevel="h1"
        titleTestId="api-keys-settings-restricted-title"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="api-keys-settings-page-breadcrumb"
            items={[
              { label: "Administration", href: SETTINGS_ROOT_PATH },
              { label: API_KEYS_PAGE_TITLE },
            ]}
          />
        }
        actions={<PageContextualHelpButton />}
      />
      <EnterpriseCompactEmptyState
        title={emptyCompact.title}
        description={emptyCompact.description}
        actions={emptyCompact.actions}
        testId={emptyCompact.testId}
      />
    </OperatorPageContainer>
  );
}
