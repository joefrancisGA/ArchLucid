"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { OperatorScopeRecord } from "@/lib/operator-scope-storage";

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
    <header className="space-y-3" data-testid="settings-master-overview-header">
      <div>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Settings</h1>
        <p className={cn("mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Manage workspace, governance, integration, security, billing, and support configuration.
        </p>
      </div>
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
    </header>
  );
}
