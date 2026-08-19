"use client";

import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import {
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_HEADING,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_LEAD,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_WORKSPACE_ACTION_LABEL,
  CLOUD_CONNECTIONS_PLATFORM_SCOPE_WORKSPACE_REQUIRED,
} from "@/lib/cloud-connections-copy";
import {
  type CloudPlatformId,
  type CloudPlatformScope,
} from "@/lib/cloud-platform-scope-storage";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const PLATFORM_LABELS: Readonly<Record<CloudPlatformId, string>> = {
  "evidence-only": "Evidence-only",
  azure: "Azure",
  aws: "AWS",
  gcp: "GCP",
};

const SCOPE_SWITCHER_HELP_HREF = "/help/scope";

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
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {CLOUD_CONNECTIONS_PLATFORM_SCOPE_LEAD}
      </p>
      {!persistAvailable ? (
        <p
          id="cloud-platform-scope-workspace-required"
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          role="status"
          data-testid="cloud-platform-scope-workspace-required"
        >
          {CLOUD_CONNECTIONS_PLATFORM_SCOPE_WORKSPACE_REQUIRED}{" "}
          <Link
            href={SCOPE_SWITCHER_HELP_HREF}
            className={cn(OPERATOR_LINK.inline, "font-medium")}
            data-testid="cloud-platform-scope-workspace-action"
          >
            {CLOUD_CONNECTIONS_PLATFORM_SCOPE_WORKSPACE_ACTION_LABEL}
          </Link>
        </p>
      ) : null}
      <div
        className="mt-3 flex flex-wrap gap-x-6 gap-y-3"
        role="group"
        aria-labelledby="cloud-platform-scope-heading"
        aria-describedby={!persistAvailable ? "cloud-platform-scope-workspace-required" : undefined}
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
                !persistAvailable ? "cursor-not-allowed" : null,
              )}
            >
              <Checkbox
                id={checkboxId}
                checked={scope[platformId]}
                disabled={!persistAvailable}
                onCheckedChange={() => togglePlatform(platformId)}
                data-testid={`cloud-platform-scope-${platformId}`}
                className={cn(
                  "h-6 w-6 shrink-0 rounded border-2 border-neutral-600 accent-teal-700",
                  "focus-visible:ring-teal-600/40 disabled:opacity-100",
                  "dark:border-neutral-400 dark:accent-teal-500",
                  scope[platformId] ? "border-teal-700 bg-teal-700 dark:border-teal-500 dark:bg-teal-600" : null,
                )}
              />
              <span className={cn(!persistAvailable ? "text-al-text-secondary" : "text-al-text-primary")}>
                {PLATFORM_LABELS[platformId]}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
