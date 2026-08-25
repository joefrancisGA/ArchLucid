"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  JIRA_MUTATION_DISABLED_HELPER,
  JIRA_RELOAD_BUTTON,
  JIRA_SAVE_PENDING,
  JIRA_SAVE_SETTINGS_BUTTON,
  JIRA_WORKSPACE_ROUTING_COLLAPSED_SUMMARY,
  JIRA_WORKSPACE_ROUTING_LEAD,
  JIRA_WORKSPACE_ROUTING_TITLE,
  JIRA_WORKSPACE_ROUTING_UNAVAILABLE_LEAD,
} from "@/lib/jira-integration-page-copy";
import type { resolveJiraPageComposition } from "@/lib/jira-integration-present";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { JiraIssueTypeBySeverityField } from "../../_sections/itsm/JiraIssueTypeBySeverityField";

export type JiraWorkspaceRoutingPanelProps = {
  readonly pageComposition: ReturnType<typeof resolveJiraPageComposition>;
  readonly canMutate: boolean;
  readonly workspaceRoutingEditable: boolean;
  readonly settingsLoadFailed: boolean;
  readonly jiraProjectKey: string;
  readonly onJiraProjectKeyChange: (value: string) => void;
  readonly jiraSendInfo: boolean;
  readonly onJiraSendInfoChange: (checked: boolean) => void;
  readonly issueTypeJson: string;
  readonly onIssueTypeJsonChange: (value: string) => void;
  readonly saveError: string | null;
  readonly saveSuccess: string | null;
  readonly isSaving: boolean;
  readonly isTesting: boolean;
  readonly onSaveSettings: () => void;
  readonly onRefresh: () => void;
};

export function JiraWorkspaceRoutingPanel({
  pageComposition,
  canMutate,
  workspaceRoutingEditable,
  settingsLoadFailed,
  jiraProjectKey,
  onJiraProjectKeyChange,
  jiraSendInfo,
  onJiraSendInfoChange,
  issueTypeJson,
  onIssueTypeJsonChange,
  saveError,
  saveSuccess,
  isSaving,
  isTesting,
  onSaveSettings,
  onRefresh,
}: JiraWorkspaceRoutingPanelProps): React.ReactElement | null {
  if (pageComposition.workspaceRoutingCollapsed) {
    return (
      <details
        className="rounded-md border border-neutral-200 bg-neutral-50/80 p-5 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="jira-workspace-routing-collapsed"
      >
        <summary
          className={cn(
            "cursor-pointer select-none outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] focus-visible:ring-offset-2",
            OPERATOR_DISCLOSURE_TRIGGER_CLASS,
          )}
        >
          {JIRA_WORKSPACE_ROUTING_COLLAPSED_SUMMARY}
        </summary>
        <div className="mt-3 space-y-3">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {JIRA_WORKSPACE_ROUTING_UNAVAILABLE_LEAD}
          </p>
        </div>
      </details>
    );
  }

  return (
    <section
      aria-labelledby="jira-workspace-routing-heading"
      className="space-y-4 rounded-md border border-neutral-200 p-5 dark:border-neutral-800"
      data-testid="jira-workspace-routing"
    >
      <div>
        <h2 id="jira-workspace-routing-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {JIRA_WORKSPACE_ROUTING_TITLE}
        </h2>
        <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {JIRA_WORKSPACE_ROUTING_LEAD}
        </p>
      </div>

      {saveError ? (
        <p className="m-0 text-red-600 dark:text-red-400" role="alert">
          {saveError}
        </p>
      ) : null}

      {saveSuccess ? (
        <p className="m-0 text-teal-800 dark:text-teal-200" role="status">
          {saveSuccess}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="jira-project-key">Jira project key override</Label>
        <Input
          id="jira-project-key"
          value={jiraProjectKey}
          onChange={(event) => onJiraProjectKeyChange(event.target.value)}
          disabled={isSaving || !workspaceRoutingEditable}
          placeholder="e.g. ARCH"
          autoComplete="off"
        />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="jira-send-info"
          checked={jiraSendInfo}
          onCheckedChange={(checked) => onJiraSendInfoChange(checked === true)}
          disabled={isSaving || !workspaceRoutingEditable}
        />
        <Label htmlFor="jira-send-info">Send informational findings to Jira at low priority</Label>
      </div>

      <JiraIssueTypeBySeverityField
        value={issueTypeJson}
        onChange={onIssueTypeJsonChange}
        disabled={isSaving || !workspaceRoutingEditable}
      />

      {settingsLoadFailed ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          Workspace routing settings could not be loaded. Reload the page before changing them.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={onSaveSettings}
          disabled={isSaving || !workspaceRoutingEditable}
          title={!canMutate ? enterpriseMutationControlDisabledTitle : undefined}
        >
          {isSaving ? JIRA_SAVE_PENDING : JIRA_SAVE_SETTINGS_BUTTON}
        </Button>
        <Button type="button" variant="outline" onClick={onRefresh} disabled={isSaving || isTesting}>
          {JIRA_RELOAD_BUTTON}
        </Button>
      </div>

      {!canMutate ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{JIRA_MUTATION_DISABLED_HELPER}</p>
      ) : null}
    </section>
  );
}
