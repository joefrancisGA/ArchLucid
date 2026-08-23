"use client";

import { useState } from "react";

import { PreferenceAccountSyncStatus } from "@/components/preferences/PreferenceAccountSyncStatus";
import { PreferenceCheckbox } from "@/components/preferences/PreferenceCheckbox";
import {
  PREFERENCES_CLOUD_PLATFORMS_EMPTY_SELECTION_MESSAGE,
  PREFERENCES_CLOUD_PLATFORMS_LEAD,
  PREFERENCES_CLOUD_PLATFORMS_SCOPE_TAG,
} from "@/lib/cloud-platform-scope-copy";
import {
  CLOUD_PLATFORM_SCOPE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE,
  CLOUD_PROVIDER_NEUTRAL_ORDER,
  type CloudPlatformScope,
  type CloudProviderId,
} from "@/lib/cloud-platform-scope-storage";
import { wouldLeaveNoVisibleCloudProviders } from "@/lib/cloud-platform-scope-validation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CloudPlatformScopeAccountSyncState } from "@/lib/use-cloud-platform-scope";
import { cn } from "@/lib/utils";

const PROVIDER_LABELS: Readonly<Record<CloudProviderId, string>> = {
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
};

export type CloudPlatformScopePanelProps = {
  readonly scope: CloudPlatformScope;
  readonly onScopeChange: (nextScope: CloudPlatformScope) => void;
  readonly accountSyncState?: CloudPlatformScopeAccountSyncState;
  readonly labelledById?: string;
};

export function CloudPlatformScopePanel({
  scope,
  onScopeChange,
  accountSyncState = "idle",
  labelledById,
}: CloudPlatformScopePanelProps) {
  const [emptySelectionMessage, setEmptySelectionMessage] = useState<string | null>(null);

  const toggleProvider = (providerId: CloudProviderId) => {
    if (wouldLeaveNoVisibleCloudProviders(scope, providerId)) {
      setEmptySelectionMessage(PREFERENCES_CLOUD_PLATFORMS_EMPTY_SELECTION_MESSAGE);

      return;
    }

    setEmptySelectionMessage(null);
    onScopeChange({
      ...scope,
      [providerId]: !scope[providerId],
    });
  };

  return (
    <section className="space-y-3" data-testid="cloud-platform-scope-panel" aria-labelledby={labelledById}>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-al-text-primary">{PREFERENCES_CLOUD_PLATFORMS_SCOPE_TAG}.</span>{" "}
        {PREFERENCES_CLOUD_PLATFORMS_LEAD}
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-3" role="group" aria-labelledby={labelledById}>
        {CLOUD_PROVIDER_NEUTRAL_ORDER.map((providerId) => {
          const checkboxId = `cloud-platform-scope-${providerId}`;

          return (
            <label
              key={providerId}
              htmlFor={checkboxId}
              className={cn(
                "flex min-h-6 min-w-[8.5rem] cursor-pointer items-center gap-3",
                OPERATOR_TYPOGRAPHY.body,
                "text-al-text-primary",
              )}
            >
              <PreferenceCheckbox
                id={checkboxId}
                checked={scope[providerId]}
                onCheckedChange={() => toggleProvider(providerId)}
                data-testid={`cloud-platform-scope-${providerId}`}
              />
              <span>{PROVIDER_LABELS[providerId]}</span>
            </label>
          );
        })}
      </div>
      {emptySelectionMessage !== null ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="alert"
          data-testid="cloud-platform-scope-empty-selection"
        >
          {emptySelectionMessage}
        </p>
      ) : null}
      <PreferenceAccountSyncStatus
        accountSyncState={accountSyncState}
        localOnlyMessage={CLOUD_PLATFORM_SCOPE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE}
        testIdPrefix="cloud-platform-scope"
      />
    </section>
  );
}
