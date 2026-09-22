"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  getDesktopNotificationPermission,
  showDesktopNotification,
} from "@/lib/browser-desktop-notification";
import { isDocumentHidden } from "@/lib/document-visibility";
import {
  getInFlightOperations,
} from "@/lib/operations/in-flight-operations-store";
import {
  markReviewPipelineCompletionNotified,
  wasReviewPipelineCompletionNotified,
} from "@/lib/review-pipeline-completion-notify-dedupe";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { parseArchitectureNestedRoute } from "@/lib/architecture/working-architecture-draft-routes";
import { resolveReviewCompletionHref } from "@/lib/reviews/resolve-review-completion-href";
import {
  REVIEW_PIPELINE_COMPLETION_NOTIFICATION_TITLE,
  REVIEW_PIPELINE_COMPLETION_TOAST_TITLE,
} from "@/lib/review-execution-background-safety-copy";

function pathnameMatchesRun(pathname: string, runId: string): boolean {
  const trimmedRunId = runId.trim();
  const encodedRunId = encodeURIComponent(trimmedRunId);
  const peerSegment = `/architecture/reviews/${encodedRunId}`;

  if (pathname === peerSegment || pathname.startsWith(`${peerSegment}/`)) {
    return true;
  }

  const nestedRoute = parseArchitectureNestedRoute(pathname.split("?")[0] ?? "");

  if (nestedRoute?.childKind === "reviews" && nestedRoute.childId === trimmedRunId) {
    return true;
  }

  return false;
}

export type UseReviewCompletionNotificationOptions = {
  readonly runId: string;
  readonly enabled: boolean;
  readonly isComplete: boolean;
  readonly reviewLabel?: string | null;
  readonly architectureId?: string | null;
  readonly requestId?: string | null;
};

/**
 * Notifies the operator when pipeline progress completes while they are elsewhere (TB-2149).
 * Complements TB-2077 shell in-flight toasts for async execute operations.
 */
export function useReviewCompletionNotification(
  options: UseReviewCompletionNotificationOptions,
): void {
  const pathname = usePathname() ?? "/";
  const { isWorkingMode } = useWorkspaceMode();
  const notifiedRef = useRef(false);
  const wasCompleteRef = useRef(options.isComplete);

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    if (options.isComplete && !wasCompleteRef.current && !notifiedRef.current) {
      if (wasReviewPipelineCompletionNotified(options.runId)) {
        notifiedRef.current = true;
        wasCompleteRef.current = options.isComplete;
        return;
      }

      const shellTrackedRun = getInFlightOperations().some((operation) => operation.runId === options.runId);

      if (shellTrackedRun) {
        notifiedRef.current = true;
        wasCompleteRef.current = options.isComplete;
        return;
      }

      notifiedRef.current = true;

      const onRunPage = pathnameMatchesRun(pathname, options.runId);
      const description =
        options.reviewLabel && options.reviewLabel.trim().length > 0
          ? options.reviewLabel.trim()
          : "Open the review to see results.";

      if (!onRunPage || isDocumentHidden()) {
        const href = resolveReviewCompletionHref({
          runId: options.runId,
          pathname,
          architectureId: options.architectureId,
          requestId: options.requestId,
          isWorkingMode,
        });
        const notified = showDesktopNotification(REVIEW_PIPELINE_COMPLETION_NOTIFICATION_TITLE, {
          body: description,
          tag: `review-complete:${options.runId}`,
        });

        if (!notified) {
          toast.success(REVIEW_PIPELINE_COMPLETION_TOAST_TITLE, {
            description,
            action: onRunPage
              ? undefined
              : {
                  label: "Open",
                  onClick: () => {
                    window.location.assign(href);
                  },
                },
          });
        }

        markReviewPipelineCompletionNotified(options.runId);
      }
    }

    wasCompleteRef.current = options.isComplete;
  }, [
    options.architectureId,
    options.enabled,
    options.isComplete,
    options.requestId,
    options.reviewLabel,
    options.runId,
    pathname,
    isWorkingMode,
  ]);

  useEffect(() => {
    notifiedRef.current = false;
    wasCompleteRef.current = false;
  }, [options.runId]);
}

export function canPromptForDesktopNotifications(): boolean {
  return getDesktopNotificationPermission() === "default";
}
