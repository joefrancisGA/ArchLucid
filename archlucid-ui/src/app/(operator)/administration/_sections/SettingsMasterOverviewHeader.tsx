"use client";

import { cn } from "@/lib/utils";
import { PageHeading } from "@/components/PageHeading";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";

import type { OperatorScopeRecord } from "@/lib/operator/operator-scope-storage";

type SettingsMasterOverviewHeaderProps = {
  readonly scope: OperatorScopeRecord | null;
  readonly environmentLabel: string;
};

function formatScopeSummary(scope: OperatorScopeRecord | null): string {
  if (scope === null) {
    return "Workspace scope not selected";
  }

  const workspace = scope.workspaceLabel.length > 0 ? scope.workspaceLabel : scope.workspaceId;
  const project = scope.projectLabel.length > 0 ? scope.projectLabel : scope.projectId;

  return `Tenant · ${workspace} · ${project}`;
}

/** Master settings overview with scope and environment context. */
export function SettingsMasterOverviewHeader(props: SettingsMasterOverviewHeaderProps) {
  return (
    <PageHeading
      navHref={SETTINGS_ROOT_PATH}
      title="Settings"
      description="Manage workspace, governance, integration, security, billing, and support configuration."
      actions={<PageContextualHelpButton />}
      data-testid="settings-master-overview-header"
    >
      <dl className={cn("m-0 flex flex-wrap gap-3", OPERATOR_TYPOGRAPHY.helper)}>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
          <dt className="text-al-text-secondary">Scope</dt>
          <dd className="m-0 font-medium text-al-text-primary">{formatScopeSummary(props.scope)}</dd>
        </div>
        <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
          <dt className="text-al-text-secondary">Environment</dt>
          <dd className="m-0 font-medium text-al-text-primary">{props.environmentLabel}</dd>
        </div>
      </dl>
    </PageHeading>
  );
}
