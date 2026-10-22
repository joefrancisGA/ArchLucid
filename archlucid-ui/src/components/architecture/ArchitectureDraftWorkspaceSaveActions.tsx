"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { Button } from "@/components/ui/button";
import type { ArchitectureDraftSaveState } from "@/hooks/use-architecture-draft-autosave";
import { SOFT_NAVIGATION_TIMEOUT_MS } from "@/hooks/use-soft-navigation-loading";
import {
  hasArchitectureDraftSaveableContent,
  type ArchitectureDraftFieldState,
} from "@/lib/architecture/architecture-draft-readiness";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { resolveSystemNotJobWorkingPortfolioSaveAndExitHref } from "@/lib/system-not-job-draft-list-reachable-from-portfolio";
import { showMutationError } from "@/lib/toast";

type ArchitectureDraftWorkspaceSaveActionsProps = {
  readonly editorLocked: boolean;
  readonly saveState: ArchitectureDraftSaveState;
  readonly conflictMessage: string | null;
  readonly isNewDraft: boolean;
  readonly hasPersistedDraft: boolean;
  readonly fields: ArchitectureDraftFieldState;
  readonly saveDraft: () => Promise<boolean>;
  readonly wasLastSaveConflict?: () => boolean;
  readonly onExitPendingChange: (pending: boolean) => void;
  readonly children?: ReactNode;
};

export function ArchitectureDraftWorkspaceSaveActions(
  props: ArchitectureDraftWorkspaceSaveActionsProps,
): React.JSX.Element {
  const router = useRouter();
  const { isWorkingMode } = useWorkspaceMode();
  const [saveActionError, setSaveActionError] = useState<string | null>(null);
  const exitTimeoutIdRef = useRef<number | null>(null);
  const portfolioExitHref = isWorkingMode
    ? resolveSystemNotJobWorkingPortfolioSaveAndExitHref()
    : ARCHITECTURES_LIST_PATH;

  useEffect(() => {
    return () => {
      if (exitTimeoutIdRef.current !== null) {
        window.clearTimeout(exitTimeoutIdRef.current);
        exitTimeoutIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (props.conflictMessage !== null) {
      setSaveActionError(null);
    }
  }, [props.conflictMessage]);

  const handleSaveDraft = useCallback(async () => {
    setSaveActionError(null);
    const saved = await props.saveDraft();

    if (saved) {
      return;
    }

    if (props.conflictMessage !== null || props.wasLastSaveConflict?.() === true) {
      return;
    }

    // Conflict banner is driven by autosave hook state on the next render — keep failures on-page.
    setSaveActionError("Could not save your architecture draft. Try again.");
    showMutationError("Architecture draft", "Could not save your architecture draft. Try again.");
  }, [props.conflictMessage, props.saveDraft, props.wasLastSaveConflict]);

  const handleSaveAndExit = useCallback(async () => {
    if (
      props.isNewDraft &&
      !props.hasPersistedDraft &&
      !hasArchitectureDraftSaveableContent(props.fields)
    ) {
      router.push(portfolioExitHref);

      return;
    }

    props.onExitPendingChange(true);
    setSaveActionError(null);

    const saved = await props.saveDraft();

    if (!saved) {
      props.onExitPendingChange(false);

      if (props.conflictMessage !== null || props.wasLastSaveConflict?.() === true) {
        return;
      }

      setSaveActionError("Exit paused — save your changes before leaving this page.");
      showMutationError("Architecture draft", "Exit paused — save your changes before leaving this page.");

      return;
    }

    if (exitTimeoutIdRef.current !== null) {
      window.clearTimeout(exitTimeoutIdRef.current);
    }

    // Soft-nav stall must not leave Save and exit depressed forever.
    exitTimeoutIdRef.current = window.setTimeout(() => {
      props.onExitPendingChange(false);
      exitTimeoutIdRef.current = null;
    }, SOFT_NAVIGATION_TIMEOUT_MS);

    router.push(portfolioExitHref);
  }, [
    portfolioExitHref,
    props.fields,
    props.hasPersistedDraft,
    props.isNewDraft,
    props.onExitPendingChange,
    props.saveDraft,
    router,
  ]);

  return (
    <>
      {saveActionError !== null && props.conflictMessage === null ? (
        <OperatorMutationInlineError
          message={saveActionError}
          testId="architecture-draft-save-action-error"
          recoveryScenario="api-problem"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {props.children}
        {props.saveState === "error" || props.saveState === "offline" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={props.editorLocked}
            onClick={() => {
              void handleSaveDraft();
            }}
            data-testid="architecture-save-draft-retry"
          >
            Save now
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={props.editorLocked || props.saveState === "saving"}
          onClick={() => {
            void handleSaveAndExit();
          }}
          data-testid="architecture-save-and-exit"
        >
          Save and exit
        </Button>
      </div>
    </>
  );
}
