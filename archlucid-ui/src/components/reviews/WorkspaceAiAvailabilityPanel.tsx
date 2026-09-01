"use client";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  useWorkspaceAiAvailabilityCheck,
  type WorkspaceAiAvailabilityCheck,
} from "@/hooks/useWorkspaceAiAvailabilityCheck";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { WorkspaceAiConfigurationSignal } from "@/lib/review-failure-recovery-role-copy";
import {
  workspaceAiAvailabilityStatusLabel,
  workspaceAiUnavailableDetail,
} from "@/lib/workspace-ai-availability";
import { cn } from "@/lib/utils";

export type WorkspaceAiAvailabilityPanelProps = {
  readonly workspaceAiSignal: WorkspaceAiConfigurationSignal;
  readonly availabilityCheck?: WorkspaceAiAvailabilityCheck;
};

function statusTagKind(
  state: ReturnType<typeof useWorkspaceAiAvailabilityCheck>["state"],
): "ready" | "needs-attention" | "blocked" | "in-progress" {
  if (state.status === "loading") {
    return "in-progress";
  }

  if (state.status === "idle") {
    return "needs-attention";
  }

  if (state.status === "error") {
    return "blocked";
  }

  return state.result.isAvailable ? "ready" : "needs-attention";
}

function resolveProbeModelLabel(debug: Readonly<Record<string, string>>): string | null {
  const deployment = debug.probeDeploymentName?.trim();
  const model = debug.probeModelId?.trim();

  if (deployment && model) {
    return `Deployment ${deployment} · model ${model}`;
  }

  if (deployment) {
    return `Deployment ${deployment}`;
  }

  if (model) {
    return `Model ${model}`;
  }

  return null;
}

/** API-validated workspace AI availability with full probe diagnostics for review failure recovery. */
export function WorkspaceAiAvailabilityPanel(props: WorkspaceAiAvailabilityPanelProps): React.JSX.Element {
  const { workspaceAiSignal, availabilityCheck } = props;
  const internalCheck = useWorkspaceAiAvailabilityCheck({
    enabled: availabilityCheck === undefined,
    autoCheck: false,
  });
  const { state, checkAvailability } = availabilityCheck ?? internalCheck;

  const label =
    state.status === "loaded"
      ? workspaceAiAvailabilityStatusLabel(state.result)
      : workspaceAiSignal.label;

  const detail =
    state.status === "loaded"
      ? state.result.isAvailable
        ? state.result.summary
        : workspaceAiUnavailableDetail(state.result)
      : state.status === "error"
        ? `${workspaceAiSignal.detail} Availability check failed: ${state.message}`
        : workspaceAiSignal.detail;

  const probeModelLabel = state.status === "loaded" ? resolveProbeModelLabel(state.result.debug) : null;

  const liveProbeFailure =
    state.status === "loaded"
      ? state.result.checks.find(
          (row) =>
            row.status === "failed" &&
            (row.name === "azure_openai_live_completion_probe" || row.name === "customer_connection_live_probe"),
        )
      : null;

  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised p-3 dark:border-neutral-800"
      data-testid="review-package-workspace-ai-availability-panel"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <StatusTag kind={statusTagKind(state)} label={label} />
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="review-package-workspace-ai-detail">
            {detail}
          </p>
          {state.status === "idle" ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {availabilityCheck !== undefined
                ? "Validating live AI availability for this session…"
                : "Press Check AI availability to run a live probe against your configured model. Outage claims appear only after you validate."}
            </p>
          ) : null}
          {state.status === "loading" ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Running a live completion probe (typically a few seconds). You can press the button again to retry.
            </p>
          ) : null}
          {probeModelLabel !== null ? (
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-package-workspace-ai-model">
              {probeModelLabel}
            </p>
          ) : null}
          {liveProbeFailure !== null && liveProbeFailure !== undefined ? (
            <p
              className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="review-package-workspace-ai-vendor-error"
              role="alert"
            >
              Vendor response: {liveProbeFailure.detail}
            </p>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => void checkAvailability({ force: true })}
          data-testid="review-package-check-ai-availability-button"
        >
          {state.status === "loading" ? "Checking AI availability…" : "Check AI availability"}
        </Button>
      </div>

      {state.status === "loaded" ? (
        <div className="mt-3 space-y-3" data-testid="review-package-workspace-ai-debug">
          <div>
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Probe checks</p>
            <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {state.result.checks.map((row) => (
                <li key={`${row.name}:${row.status}`}>
                  <span className="font-medium text-al-text-primary">{row.name}</span>
                  {" — "}
                  <span>{row.status}</span>
                  {row.detail.trim().length > 0 ? `: ${row.detail}` : null}
                </li>
              ))}
            </ul>
          </div>

          {Object.keys(state.result.debug).length > 0 ? (
            <div>
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Debug metadata</p>
              <dl className={cn("m-0 mt-2 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
                {Object.entries(state.result.debug).map(([key, value]) => (
                  <div key={key}>
                    <dt className="font-medium text-neutral-500 dark:text-neutral-400">{key}</dt>
                    <dd className="m-0 mt-1 break-all text-neutral-800 dark:text-neutral-200">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-package-workspace-ai-as-of">
            Validated at {new Date(state.result.asOfUtc).toLocaleString()} · source {state.result.aiSource}
          </p>
        </div>
      ) : null}

      {state.status === "error" ? (
        <p className={cn("m-0 mt-3 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          Could not validate AI availability. Use Check AI availability to retry, or open Report a problem if this persists.
        </p>
      ) : null}
    </div>
  );
}
