"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  PREFERENCES_CLOUD_PLATFORMS_HEADING,
  PREFERENCES_CLOUD_PLATFORMS_LEAD,
} from "@/lib/cloud-platform-scope-copy";
import {
  CLOUD_PLATFORM_SCOPE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE,
  type CloudPlatformId,
  type CloudPlatformScope,
} from "@/lib/cloud-platform-scope-storage";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { CloudPlatformScopeAccountSyncState } from "@/lib/use-cloud-platform-scope";
import { cn } from "@/lib/utils";

const PLATFORM_LABELS: Readonly<Record<CloudPlatformId, string>> = {
  "evidence-only": "Evidence-only",
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
};

export type CloudPlatformScopePanelProps = {
  readonly scope: CloudPlatformScope;
  readonly onScopeChange: (nextScope: CloudPlatformScope) => void;
  readonly accountSyncState?: CloudPlatformScopeAccountSyncState;
};

export function CloudPlatformScopePanel({
  scope,
  onScopeChange,
  accountSyncState = "idle",
}: CloudPlatformScopePanelProps) {
  const togglePlatform = (platformId: CloudPlatformId) => {
    onScopeChange({
      ...scope,
      [platformId]: !scope[platformId],
    });
  };

  return (
    <section
      className="space-y-3"
      data-testid="cloud-platform-scope-panel"
      aria-labelledby="cloud-platform-scope-heading"
    >
      <div>
        <h2 id="cloud-platform-scope-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {PREFERENCES_CLOUD_PLATFORMS_HEADING}
        </h2>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {PREFERENCES_CLOUD_PLATFORMS_LEAD}
        </p>
      </div>
      <div
        className="flex flex-wrap gap-x-6 gap-y-3"
        role="group"
        aria-labelledby="cloud-platform-scope-heading"
      >
        {(Object.keys(PLATFORM_LABELS) as CloudPlatformId[]).map((platformId) => {
          const checkboxId = `cloud-platform-scope-${platformId}`;

          return (
            <label
              key={platformId}
              htmlFor={checkboxId}
              className={cn(
                "flex min-h-6 min-w-[8.5rem] cursor-pointer items-center gap-3",
                OPERATOR_TYPOGRAPHY.body,
                "text-al-text-primary",
              )}
            >
              <Checkbox
                id={checkboxId}
                checked={scope[platformId]}
                onCheckedChange={() => togglePlatform(platformId)}
                data-testid={`cloud-platform-scope-${platformId}`}
                className={cn(
                  "h-6 w-6 shrink-0 rounded border-2 border-neutral-600 accent-teal-700",
                  "focus-visible:ring-teal-600/40",
                  "dark:border-neutral-400 dark:accent-teal-500",
                  scope[platformId] ? "border-teal-700 bg-teal-700 dark:border-teal-500 dark:bg-teal-600" : null,
                )}
              />
              <span>{PLATFORM_LABELS[platformId]}</span>
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
