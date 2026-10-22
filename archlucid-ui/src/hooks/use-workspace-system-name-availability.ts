"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchWorkspaceSystemNameAvailability } from "@/lib/api/workspace-system-name-availability-api";
import {
  workspaceSystemNameConflictMessage,
  WORKSPACE_SYSTEM_NAME_VALIDATION_UNAVAILABLE_HELPER,
  type WorkspaceSystemNameOccupancyKind,
} from "@/lib/workspace-system-name-availability-copy";

/** Debounce window before calling workspace name availability while typing. */
export const WORKSPACE_SYSTEM_NAME_AVAILABILITY_DEBOUNCE_MS = 450;

export type WorkspaceSystemNameAvailabilityOptions = {
  readonly systemName: string;
  readonly occupancyKind?: WorkspaceSystemNameOccupancyKind;
  readonly excludeDraftId?: string | null;
  readonly excludeRunId?: string | null;
  /** When false, skips remote checks (e.g. field hidden or form disabled). Defaults to true. */
  readonly enabled?: boolean;
  /** Minimum trimmed length before probing. Defaults to 1. */
  readonly minTrimmedLength?: number;
};

export type WorkspaceSystemNameAvailabilityState = {
  readonly isAvailable: boolean;
  readonly conflictMessage: string | null;
  readonly validating: boolean;
  readonly validationReady: boolean;
  readonly validationUnavailable: boolean;
  readonly blocksSubmit: boolean;
};

const idleAvailableState: WorkspaceSystemNameAvailabilityState = {
  isAvailable: true,
  conflictMessage: null,
  validating: false,
  validationReady: true,
  validationUnavailable: false,
  blocksSubmit: false,
};

function buildState(options: {
  readonly isAvailable: boolean;
  readonly conflictMessage: string | null;
  readonly validating: boolean;
  readonly validationReady: boolean;
  readonly validationUnavailable: boolean;
}): WorkspaceSystemNameAvailabilityState {
  const blocksSubmit =
    options.validationUnavailable
      ? false
      : options.validationReady && !options.validating && !options.isAvailable;

  return {
    isAvailable: options.isAvailable,
    conflictMessage: options.conflictMessage,
    validating: options.validating,
    validationReady: options.validationReady,
    validationUnavailable: options.validationUnavailable,
    blocksSubmit,
  };
}

/**
 * Debounced workspace name availability probe for intake forms.
 * Empty names are treated as available and do not call the API.
 */
export function useWorkspaceSystemNameAvailability(
  options: WorkspaceSystemNameAvailabilityOptions,
): WorkspaceSystemNameAvailabilityState {
  const [state, setState] = useState<WorkspaceSystemNameAvailabilityState>(idleAvailableState);
  const enabled = options.enabled ?? true;
  const minTrimmedLength = options.minTrimmedLength ?? 1;
  const occupancyKind = options.occupancyKind ?? "review";
  const trimmedName = options.systemName.trim();
  const excludeDraftId = options.excludeDraftId ?? null;
  const excludeRunId = options.excludeRunId ?? null;

  useEffect(() => {
    let canceled = false;

    if (!enabled || trimmedName.length < minTrimmedLength) {
      setState(idleAvailableState);

      return;
    }

    setState((previous) =>
      buildState({
        isAvailable: previous.isAvailable,
        conflictMessage: previous.conflictMessage,
        validating: true,
        validationReady: false,
        validationUnavailable: false,
      }),
    );

    let cleanupRequest: (() => void) | null = null;

    const timer = window.setTimeout(() => {
      const controller = new AbortController();

      void (async () => {
        try {
          const response = await fetchWorkspaceSystemNameAvailability({
            systemName: trimmedName,
            occupancyKind,
            excludeDraftId,
            excludeRunId,
            signal: controller.signal,
          });

          if (canceled) {
            return;
          }

          const isAvailable = response.isAvailable !== false;
          const conflictMessage =
            isAvailable
              ? null
              : response.conflictMessage?.trim() || workspaceSystemNameConflictMessage(trimmedName, occupancyKind);

          setState(
            buildState({
              isAvailable,
              conflictMessage,
              validating: false,
              validationReady: true,
              validationUnavailable: false,
            }),
          );
        } catch (error: unknown) {
          if (canceled || (error instanceof DOMException && error.name === "AbortError")) {
            return;
          }

          setState(
            buildState({
              isAvailable: true,
              conflictMessage: null,
              validating: false,
              validationReady: false,
              validationUnavailable: true,
            }),
          );
        }
      })();

      cleanupRequest = () => {
        controller.abort();
      };
    }, WORKSPACE_SYSTEM_NAME_AVAILABILITY_DEBOUNCE_MS);

    return () => {
      canceled = true;
      window.clearTimeout(timer);
      cleanupRequest?.();
    };
  }, [enabled, excludeDraftId, excludeRunId, minTrimmedLength, occupancyKind, trimmedName]);

  return useMemo(() => state, [state]);
}

export { WORKSPACE_SYSTEM_NAME_VALIDATION_UNAVAILABLE_HELPER };
