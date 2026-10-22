"use client";

import { StatusTag } from "@/components/ui/status-tag";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useSessionAiReadiness } from "@/hooks/session-ai-readiness-context";
import { useWorkingCareerRehearsalDoor } from "@/hooks/use-working-career-rehearsal-door";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WORKING_CAREER_REHEARSAL_INTENT_LABELS,
  type WorkingCareerRehearsalIntentId,
} from "@/lib/governance/working-career-rehearsal-intent";
import { isSampleWorkspacePresentationScope } from "@/lib/scope-switcher-display";
import { isGuidedWorkspaceMode, isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { cn } from "@/lib/utils";

function formatHostModeLabel(
  hostMode: "Simulator" | "Real" | null,
  sessionMode: "Simulator" | "Real" | null,
): string {
  if (hostMode === null && sessionMode === null) {
    return "Loading host context…";
  }

  const host = hostMode ?? "Unknown";
  const session = sessionMode ?? "Unknown";

  if (host === session) {
    return host;
  }

  return `${host} host · ${session} session`;
}

function reviewTypeLabel(door: WorkingCareerRehearsalIntentId, mounted: boolean): string {
  if (!mounted) {
    return "Loading review type…";
  }

  return WORKING_CAREER_REHEARSAL_INTENT_LABELS[door];
}

/** Live workspace density, host Mode, and review-type readout for inhabit help. */
export function InhabitHelpCurrentDeskContextPanel(): React.JSX.Element {
  const { mode: workspaceMode, mounted: workspaceMounted } = useWorkspaceMode();
  const { door, mounted: doorMounted } = useWorkingCareerRehearsalDoor();
  const { hostMode, sessionMode, isLoading: readinessLoading } = useSessionAiReadiness();
  const { workspaceId, projectId } = useOperatorScopeQueryKey();
  const isDemoWorkspace = isSampleWorkspacePresentationScope(workspaceId, projectId);

  const workspaceDensity =
    !workspaceMounted
      ? "Loading workspace mode…"
      : isWorkingWorkspaceMode(workspaceMode)
        ? "Working"
        : isGuidedWorkspaceMode(workspaceMode)
          ? "Guided"
          : workspaceMode;

  return (
    <section
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-inhabit-the-architecture-current-desk"
      aria-labelledby="help-inhabit-the-architecture-current-desk"
    >
      <h2
        id="help-inhabit-the-architecture-current-desk"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        Your current desk context
      </h2>
      <dl className="m-0 grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Workspace density</dt>
        <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-inhabit-the-architecture-current-density">
          {workspaceDensity}
        </dd>
        <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Review type</dt>
        <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-inhabit-the-architecture-current-review-type">
          {reviewTypeLabel(door, doorMounted)}
        </dd>
        <dt className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Host execution Mode</dt>
        <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.body)} data-testid="help-inhabit-the-architecture-current-host-mode">
          {readinessLoading ? "Loading host context…" : formatHostModeLabel(hostMode, sessionMode)}
        </dd>
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        {isDemoWorkspace ? (
          <StatusTag
            kind="draft"
            label="Demo workspace"
            data-testid="help-inhabit-the-architecture-demo-workspace-tag"
          />
        ) : null}
        {isWorkingWorkspaceMode(workspaceMode) ? (
          <StatusTag kind="ready" label="Working seat" data-testid="help-inhabit-the-architecture-working-seat-tag" />
        ) : null}
      </div>
    </section>
  );
}
