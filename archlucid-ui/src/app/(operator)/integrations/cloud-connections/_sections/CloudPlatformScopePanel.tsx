"use client";

import { cn } from "@/lib/utils";

import {
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_HEADING,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_LEAD,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_WORKSPACE_REQUIRED,
} from "@/lib/cloud-connections-copy";
import {
  type CloudPlatformId,
  type CloudPlatformScope,
} from "@/lib/cloud-platform-scope-storage";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const PLATFORM_LABELS: Readonly<Record<CloudPlatformId, string>> = {
  "evidence-only": "Evidence-only",
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
};

export type CloudPlatformScopePanelProps = {
  readonly scope: CloudPlatformScope;
  readonly onScopeChange: (nextScope: CloudPlatformScope) => void;
  /** When false, checkboxes are disabled and the workspace-required message is shown (TB-1142). */
  readonly persistAvailable: boolean;
};

export function CloudPlatformScopePanel({
  scope,
  onScopeChange,
  persistAvailable,
}: CloudPlatformScopePanelProps) {
  const togglePlatform = (platformId: CloudPlatformId) => {
    if (!persistAvailable) {
      return;
    }

    onScopeChange({
      ...scope,
      [platformId]: !scope[platformId],
    });
  };

  return (
    <section
      className="rounded-md border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="cloud-platform-scope-panel"
      aria-labelledby="cloud-platform-scope-heading"
    >
      <h2 id="cloud-platform-scope-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {CLOUD_CONNECTIONS_PLATFORM_SCOPE_HEADING}
      </h2>
      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>{CLOUD_CONNECTIONS_PLATFORM_SCOPE_LEAD}</p>
      {!persistAvailable ? (
        <p
          className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
          data-testid="cloud-platform-scope-workspace-required"
        >
          {CLOUD_CONNECTIONS_PLATFORM_SCOPE_WORKSPACE_REQUIRED}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-4">
        {(Object.keys(PLATFORM_LABELS) as CloudPlatformId[]).map((platformId) => (
          <label
            key={platformId}
            className={cn(
              "flex items-center gap-2",
              OPERATOR_TYPOGRAPHY.body,
              !persistAvailable ? "cursor-not-allowed opacity-60" : null,
            )}
          >
            <input
              type="checkbox"
              checked={scope[platformId]}
              disabled={!persistAvailable}
              onChange={() => togglePlatform(platformId)}
              data-testid={`cloud-platform-scope-${platformId}`}
            />
            <span>{PLATFORM_LABELS[platformId]}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
