"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { ScopeSwitcherProjectOptionButton } from "@/components/ScopeSwitcherProjectOptionButton";
import { ScopeSwitcherTenantContextFooter } from "@/components/ScopeSwitcherTenantContextFooter";
import { WorkspaceScopeTenantSettingsVocabularyRail } from "@/components/WorkspaceScopeTenantSettingsVocabularyRail";
import { WorkspaceSwitcherFirstOpenCoach } from "@/components/WorkspaceSwitcherFirstOpenCoach";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  BUYER_SCOPE_CURRENT_WORKSPACE_BODY,
  BUYER_SCOPE_CURRENT_WORKSPACE_TITLE,
  BUYER_SCOPE_LIST_UNAVAILABLE,
  BUYER_SCOPE_SAMPLE_WORKSPACE_BODY,
  BUYER_SCOPE_SAMPLE_WORKSPACE_CONNECTED_HINT,
  BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT,
  BUYER_SCOPE_SAMPLE_WORKSPACE_TITLE,
  BUYER_SCOPE_SWITCHER_CLOSE,
  BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES,
  BUYER_SCOPE_SWITCHER_LOAD_ERROR,
} from "@/lib/buyer/buyer-polish-copy";
import {
  clearOperatorScopeStorage,
  isDevDefaultScopeRecord,
  type OperatorScopeRecord,
} from "@/lib/operator/operator-scope-storage";
import {
  isScopeSwitcherOptionSelected,
  resolveScopeSwitcherOptionPrimaryLabel,
  type ScopeSwitcherWorkspaceOption,
} from "@/lib/scope-switcher-display";
import { DEV_SCOPE_TENANT_ID } from "@/lib/scope";

import type { ScopePanelMode } from "./scope-switcher-panel-style";

const SCOPE_SWITCHER_HELP_HREF = "/help/scope";

function isNonEmptyId(value: string | undefined | null): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

export type ScopeSwitcherPanelBodyProps = {
  readonly open: boolean;
  readonly panelMode: ScopePanelMode;
  readonly listLoading: boolean;
  readonly listError: string | null;
  readonly workspaces: ScopeSwitcherWorkspaceOption[] | null;
  readonly stored: OperatorScopeRecord | null;
  readonly triggerLabel: string;
  readonly sampleFullTitle: string;
  readonly tenantId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly onClose: () => void;
  readonly onApplyScope: (row: OperatorScopeRecord) => void;
  readonly onClearCustomScope: () => void;
};

export function ScopeSwitcherPanelBody(props: ScopeSwitcherPanelBodyProps) {
  const {
    listError,
    listLoading,
    onApplyScope,
    onClearCustomScope,
    onClose,
    open,
    panelMode,
    projectId,
    sampleFullTitle,
    stored,
    tenantId,
    triggerLabel,
    workspaceId,
    workspaces,
  } = props;

  return (
    <>
      <WorkspaceSwitcherFirstOpenCoach open={open} />
      <WorkspaceScopeTenantSettingsVocabularyRail currentSurfaceId="workspace-scope" />
      {panelMode === "loading" ? (
        <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.body)}>Loading workspaces…</p>
      ) : null}
      {panelMode === "current-scope-info" ? (
        <>
          <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {BUYER_SCOPE_CURRENT_WORKSPACE_TITLE}
          </p>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {BUYER_SCOPE_CURRENT_WORKSPACE_BODY}
          </p>
          <p className={cn("m-0 font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
            {triggerLabel}
          </p>
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {BUYER_SCOPE_SAMPLE_WORKSPACE_CONNECTED_HINT}
          </p>
          <Button type="button" size="sm" onClick={onClose}>
            {BUYER_SCOPE_SWITCHER_CLOSE}
          </Button>
        </>
      ) : null}
      {panelMode === "sample-info" ? (
        <>
          <div className="flex flex-wrap items-start gap-2">
            <p className={cn("m-0 min-w-0 flex-1 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {sampleFullTitle}
            </p>
            <span className={cn("shrink-0 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100", OPERATOR_NAV_GROUP_LABEL)}>
              Sample
            </span>
          </div>
          <div className="space-y-1.5">
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
              {BUYER_SCOPE_SAMPLE_WORKSPACE_DEMO_HINT}
            </p>
            <p
              className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
              data-testid="operator-scope-sample-info-body"
            >
              {BUYER_SCOPE_SAMPLE_WORKSPACE_BODY}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Button type="button" size="sm" onClick={onClose}>
              {BUYER_SCOPE_SWITCHER_CLOSE}
            </Button>
            <Link
              href={SCOPE_SWITCHER_HELP_HREF}
              className={cn("font-medium text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline", OPERATOR_TYPOGRAPHY.helper,
                "dark:text-neutral-400 dark:hover:text-neutral-200",
              )}
            >
              {BUYER_SCOPE_SWITCHER_LEARN_ABOUT_WORKSPACES}
            </Link>
          </div>
        </>
      ) : null}
      {panelMode === "error" ? (
        <>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} data-testid="operator-scope-list-note">
            {listError ?? BUYER_SCOPE_SWITCHER_LOAD_ERROR}
          </p>
          <details className={cn("rounded-md border border-neutral-200 p-2 dark:border-neutral-700", OPERATOR_TYPOGRAPHY.helper)}>
            <summary className="cursor-pointer select-none font-medium text-neutral-700 dark:text-neutral-200">
              Technical details
            </summary>
            <p className="mt-2 mb-0 text-neutral-600 dark:text-neutral-400">
              {BUYER_SCOPE_LIST_UNAVAILABLE}
            </p>
          </details>
          <Button type="button" size="sm" variant="secondary" onClick={onClose}>
            {BUYER_SCOPE_SWITCHER_CLOSE}
          </Button>
        </>
      ) : null}
      {panelMode === "selector" ? (
        <>
          {workspaces !== null && workspaces.length > 0 ? (
            <div className="max-h-64 space-y-1 overflow-y-auto" role="list" aria-label="Workspaces and projects">
              {workspaces.map((ws) => {
                if (ws.projects.length === 0) {
                  return null;
                }

                const projectCount = ws.projects.length;
                const showWorkspaceGroupHeader = projectCount > 1;

                return (
                  <div key={ws.workspaceId} className="space-y-0.5" role="listitem">
                    {showWorkspaceGroupHeader ? (
                      <p
                        className={cn(
                          "m-0 truncate px-2 pt-1 font-semibold text-neutral-500 dark:text-neutral-400",
                          OPERATOR_TYPOGRAPHY.helper,
                        )}
                      >
                        {ws.name}
                      </p>
                    ) : null}
                    {ws.projects.map((pr) => {
                      const selected = isScopeSwitcherOptionSelected({
                        optionWorkspaceId: ws.workspaceId,
                        optionProjectId: pr.projectId,
                        activeWorkspaceId: workspaceId,
                        activeProjectId: projectId,
                      });
                      const optionLabel = resolveScopeSwitcherOptionPrimaryLabel({
                        workspaceName: ws.name,
                        projectName: pr.name,
                        workspaceProjectCount: projectCount,
                      });

                      return (
                        <ScopeSwitcherProjectOptionButton
                          key={pr.projectId}
                          label={optionLabel}
                          selected={selected}
                          onSelect={() => {
                            const scopeTenantId = isNonEmptyId(tenantId) ? tenantId.trim() : DEV_SCOPE_TENANT_ID;

                            onApplyScope({
                              tenantId: scopeTenantId,
                              workspaceId: ws.workspaceId,
                              projectId: pr.projectId,
                              workspaceLabel: ws.name,
                              projectLabel: pr.name,
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : null}
          {stored !== null && !isDevDefaultScopeRecord(stored) ? (
            <div className="space-y-2 border-t border-neutral-200 pt-2 dark:border-neutral-700">
              <Label className={cn("text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Override</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full"
                onClick={onClearCustomScope}
              >
                Clear custom scope
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
      <ScopeSwitcherTenantContextFooter />
    </>
  );
}
