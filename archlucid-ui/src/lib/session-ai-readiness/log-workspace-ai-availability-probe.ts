export type WorkspaceAiAvailabilityProbeTelemetry = {
  readonly outcome: "success" | "error" | "timeout";
  readonly durationMs: number;
  readonly isAvailable?: boolean;
  readonly aiSource?: string;
  readonly retryAttempt?: number;
};

/** Dev-only breadcrumbs for workspace AI availability probe timing (Phase 0 instrumentation). */
export function logWorkspaceAiAvailabilityProbe(event: WorkspaceAiAvailabilityProbeTelemetry): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.debug("[workspace-ai-availability-probe]", {
    ...event,
    at: new Date().toISOString(),
  });
}
