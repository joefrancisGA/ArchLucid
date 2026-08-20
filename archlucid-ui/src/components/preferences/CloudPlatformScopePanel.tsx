"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { PREFERENCES_CLOUD_PLATFORMS_LEAD } from "@/lib/cloud-platform-scope-copy";
import {
  CLOUD_PLATFORM_SCOPE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE,
  CLOUD_PROVIDER_NEUTRAL_ORDER,
  type CloudPlatformScope,
  type CloudProviderId,
} from "@/lib/cloud-platform-scope-storage";
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
  /** Card title id when the panel is rendered inside a CardHeader (avoids duplicate headings). */
  readonly labelledById?: string;
};

export function CloudPlatformScopePanel({
  scope,
  onScopeChange,
  accountSyncState = "idle",
  labelledById,
}: CloudPlatformScopePanelProps) {
  const toggleProvider = (providerId: CloudProviderId) => {
    onScopeChange({
      ...scope,
      [providerId]: !scope[providerId],
    });
  };

  return (
    <section
      className="space-y-3"
      data-testid="cloud-platform-scope-panel"
      aria-labelledby={labelledById}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{PREFERENCES_CLOUD_PLATFORMS_LEAD}</p>
      <div
        className="flex flex-wrap gap-x-6 gap-y-3"
        role="group"
        aria-labelledby={labelledById}
      >
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
              <Checkbox
                id={checkboxId}
                checked={scope[providerId]}
                onCheckedChange={() => toggleProvider(providerId)}
                data-testid={`cloud-platform-scope-${providerId}`}
                className={cn(
                  "h-6 w-6 shrink-0 rounded border-2 border-neutral-600 accent-teal-700",
                  "focus-visible:ring-teal-600/40",
                  "dark:border-neutral-400 dark:accent-teal-500",
                  scope[providerId] ? "border-teal-700 bg-teal-700 dark:border-teal-500 dark:bg-teal-600" : null,
                )}
              />
              <span>{PROVIDER_LABELS[providerId]}</span>
            </label>
          );
        })}
      </div>
      {accountSyncState === "local-only" ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="alert"
          data-testid="cloud-platform-scope-sync-status"
        >
          {CLOUD_PLATFORM_SCOPE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE}
        </p>
      ) : null}
    </section>
  );
}
