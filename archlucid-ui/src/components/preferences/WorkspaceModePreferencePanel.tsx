"use client";

import { PreferenceAccountSyncStatus } from "@/components/preferences/PreferenceAccountSyncStatus";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { WorkspaceModeId } from "@/lib/workspace-mode/workspace-mode";
import {
  WORKSPACE_MODE_GUIDED_DESCRIPTION,
  WORKSPACE_MODE_GUIDED_LABEL,
  WORKSPACE_MODE_PREFERENCE_HELPER,
  WORKSPACE_MODE_PREFERENCE_LEAD,
  WORKSPACE_MODE_WORKING_DESCRIPTION,
  WORKSPACE_MODE_WORKING_LABEL,
} from "@/lib/workspace-mode/workspace-mode-copy";
import { WORKSPACE_MODE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE } from "@/lib/workspace-mode/workspace-mode-preference";
import type { WorkspaceModeAccountSyncState } from "@/components/WorkspaceModeProvider";

export type WorkspaceModePreferencePanelProps = {
  readonly mode: WorkspaceModeId;
  readonly onModeChange: (mode: WorkspaceModeId) => void;
  readonly accountSyncState?: WorkspaceModeAccountSyncState;
  readonly labelledById?: string;
};

export function WorkspaceModePreferencePanel({
  mode,
  onModeChange,
  accountSyncState = "idle",
  labelledById,
}: WorkspaceModePreferencePanelProps) {
  const guidedId = "workspace-mode-guided";
  const workingId = "workspace-mode-working";

  return (
    <section
      className="space-y-3"
      data-testid="workspace-mode-preference-panel"
      aria-labelledby={labelledById}
    >
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{WORKSPACE_MODE_PREFERENCE_LEAD}</p>
      <fieldset className="space-y-3 border-0 p-0">
        <legend className="sr-only">Workspace mode</legend>
        <label
          htmlFor={guidedId}
          className={cn(
            "flex min-h-6 cursor-pointer items-start gap-3 rounded-md border border-al-border p-3",
            OPERATOR_TYPOGRAPHY.body,
            "text-al-text-primary",
            mode === "guided" ? "border-al-accent bg-al-surface-raised" : undefined,
          )}
        >
          <input
            id={guidedId}
            type="radio"
            name="workspace-mode"
            value="guided"
            checked={mode === "guided"}
            onChange={() => onModeChange("guided")}
            data-testid="workspace-mode-guided"
            className="mt-1"
          />
          <span>
            <span className="block font-medium">{WORKSPACE_MODE_GUIDED_LABEL}</span>
            <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {WORKSPACE_MODE_GUIDED_DESCRIPTION}
            </span>
          </span>
        </label>
        <label
          htmlFor={workingId}
          className={cn(
            "flex min-h-6 cursor-pointer items-start gap-3 rounded-md border border-al-border p-3",
            OPERATOR_TYPOGRAPHY.body,
            "text-al-text-primary",
            mode === "working" ? "border-al-accent bg-al-surface-raised" : undefined,
          )}
        >
          <input
            id={workingId}
            type="radio"
            name="workspace-mode"
            value="working"
            checked={mode === "working"}
            onChange={() => onModeChange("working")}
            data-testid="workspace-mode-working"
            className="mt-1"
          />
          <span>
            <span className="block font-medium">{WORKSPACE_MODE_WORKING_LABEL}</span>
            <span className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {WORKSPACE_MODE_WORKING_DESCRIPTION}
            </span>
          </span>
        </label>
      </fieldset>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{WORKSPACE_MODE_PREFERENCE_HELPER}</p>
      <PreferenceAccountSyncStatus
        accountSyncState={accountSyncState}
        localOnlyMessage={WORKSPACE_MODE_ACCOUNT_SYNC_LOCAL_ONLY_MESSAGE}
        testIdPrefix="workspace-mode"
      />
    </section>
  );
}
