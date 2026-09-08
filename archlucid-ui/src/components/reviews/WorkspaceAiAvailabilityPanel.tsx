"use client";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { InlineMetadataLabel } from "@/components/InlineMetadataLabel";
import { InlineMetadataLine } from "@/components/InlineMetadataLine";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  useWorkspaceAiAvailabilityCheck,
  type WorkspaceAiAvailabilityCheck,
} from "@/hooks/useWorkspaceAiAvailabilityCheck";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { formatRelativeTime } from "@/lib/relative-time";
import type { WorkspaceAiConfigurationSignal } from "@/lib/review-failure-recovery-role-copy";
import {
  parseWorkspaceAiProbeDiagnosticsOpenFromSearch,
  workspaceAiProbeDiagnosticsDisclosureHrefFromSearch,
} from "@/lib/reviews/workspace-ai-probe-diagnostics-disclosure-url";
import type { WorkspaceAiAvailabilityResult } from "@/lib/workspace-ai-availability";
import {
  workspaceAiAvailabilityStatusLabel,
  workspaceAiAvailableDetail,
  workspaceAiUnavailableDetail,
} from "@/lib/workspace-ai-availability";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type WorkspaceAiAvailabilityPanelProps = {
  readonly workspaceAiSignal: WorkspaceAiConfigurationSignal;
  readonly availabilityCheck?: WorkspaceAiAvailabilityCheck;
  /** When the host review is in terminal failure, avoid a green success chip above the failure cause. */
  readonly reviewTerminalFailure?: boolean;
  readonly scopingLabel?: string;
};

const PROBE_DEBUG_HEADER_KEYS = new Set(["probeDeploymentName", "probeModelId"]);

const PROBE_CHECK_BUYER_LABELS: Record<string, string> = {
  azure_openai_live_completion_probe: "Live completion check",
  customer_connection_live_probe: "Customer connection check",
  azure_openai_configuration: "Azure OpenAI configuration",
  customer_connection_configuration: "Customer AI connection configuration",
  simulator_mode: "Simulator mode",
  llm_budget_status: "LLM budget status",
  llm_circuit_breaker: "LLM circuit breaker",
  circuit_breaker_status: "Circuit breaker status",
};

function humanizeProbeCheckName(name: string): string {
  const normalized = name.trim();

  if (normalized.length === 0) {
    return "Availability check";
  }

  return normalized
    .split(/[_-]+/)
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function buyerLabelForProbeCheckName(name: string): string {
  const key = name.trim();

  return PROBE_CHECK_BUYER_LABELS[key] ?? humanizeProbeCheckName(key);
}

function probeCheckStatusKind(status: string): "ready" | "needs-attention" | "blocked" | "in-progress" {
  const normalized = status.trim().toLowerCase();

  if (normalized === "ok") {
    return "ready";
  }

  if (normalized === "degraded" || normalized === "skipped") {
    return "needs-attention";
  }

  if (normalized === "failed") {
    return "blocked";
  }

  return "needs-attention";
}

function probeCheckStatusLabel(status: string): string {
  const kind = probeCheckStatusKind(status);

  if (kind === "ready") {
    return "Ready";
  }

  if (kind === "blocked") {
    return "Blocked";
  }

  return "Needs attention";
}

function probeCheckSortPriority(status: string): number {
  const normalized = status.trim().toLowerCase();

  if (normalized === "failed") {
    return 0;
  }

  if (normalized === "degraded") {
    return 1;
  }

  if (normalized === "skipped") {
    return 2;
  }

  if (normalized === "ok") {
    return 3;
  }

  return 4;
}

function sortProbeChecks(
  checks: readonly WorkspaceAiAvailabilityResult["checks"][number][],
): readonly WorkspaceAiAvailabilityResult["checks"][number][] {
  return [...checks].sort((left, right) => probeCheckSortPriority(left.status) - probeCheckSortPriority(right.status));
}

function resolveProbeDeploymentName(debug: Readonly<Record<string, string>>): string | null {
  const deployment = debug.probeDeploymentName?.trim();

  if (!deployment) {
    return null;
  }

  return deployment;
}

function resolveProbeModelId(debug: Readonly<Record<string, string>>): string | null {
  const model = debug.probeModelId?.trim();

  if (!model) {
    return null;
  }

  return model;
}

function filterProbeDebugMetadata(
  debug: Readonly<Record<string, string>>,
  deploymentName: string | null,
): ReadonlyArray<readonly [string, string]> {
  return Object.entries(debug).filter(([key, value]) => {
    if (PROBE_DEBUG_HEADER_KEYS.has(key)) {
      return false;
    }

    if (key === "azureOpenAiDeploymentName" && deploymentName !== null && value.trim() === deploymentName) {
      return false;
    }

    return true;
  });
}

function formatProbeFreshnessLabel(asOfUtc: string): { relative: string; absolute: string } | null {
  const normalized = asOfUtc.trim();

  if (normalized.length === 0) {
    return null;
  }

  const absolute = formatInstantForLocale(normalized);

  if (absolute === " — ") {
    return null;
  }

  return {
    relative: formatRelativeTime(normalized),
    absolute,
  };
}

function buildProbeDetailsTriggerLabel(result: WorkspaceAiAvailabilityResult, compact: boolean): string {
  if (compact) {
    return "AI availability details";
  }

  const checkCount = result.checks.length;
  const validatedAt = formatProbeFreshnessLabel(result.asOfUtc);
  const checkLabel = `${checkCount} availability check${checkCount === 1 ? "" : "s"}`;

  if (validatedAt !== null) {
    return `AI availability details — ${checkLabel}, validated ${validatedAt.relative}`;
  }

  return `AI availability details — ${checkLabel}`;
}

function resolveProbeProvenanceCopy(aiSource: string): string {
  if (aiSource === "managed-platform") {
    return "ArchLucid ran a live completion probe against the Azure OpenAI deployment configured for this workspace on the managed platform.";
  }

  if (aiSource === "customer-connection") {
    return "ArchLucid ran a live completion probe against the deployment configured in your workspace customer AI connection.";
  }

  if (aiSource === "simulator") {
    return "Simulator mode is active — a live deployment probe was not required.";
  }

  return "ArchLucid ran a live completion probe against the deployment configured for this workspace.";
}

function statusTagKind(
  state: ReturnType<typeof useWorkspaceAiAvailabilityCheck>["state"],
  reviewTerminalFailure: boolean,
  probeAvailable: boolean,
): "ready" | "needs-attention" | "blocked" | "in-progress" {
  if (reviewTerminalFailure && probeAvailable) {
    return "ready";
  }

  if (state.status === "loading") {
    return "in-progress";
  }

  if (state.status === "idle") {
    return "needs-attention";
  }

  if (state.status === "error") {
    return "blocked";
  }

  return state.result.isAvailable ? "ready" : "blocked";
}

function resolveWorkspaceAiDetail(
  state: ReturnType<typeof useWorkspaceAiAvailabilityCheck>["state"],
  workspaceAiSignal: WorkspaceAiConfigurationSignal,
  managedBySession: boolean,
): string {
  if (state.status === "loaded") {
    return state.result.isAvailable
      ? workspaceAiAvailableDetail(state.result)
      : workspaceAiUnavailableDetail(state.result);
  }

  if (state.status === "loading") {
    return "Running an automatic live AI availability check for this session…";
  }

  if (state.status === "error") {
    return `Automatic AI availability check could not finish: ${state.message}`;
  }

  if (managedBySession) {
    return "Starting an automatic live AI availability check for this session…";
  }

  return workspaceAiSignal.detail;
}

function WorkspaceAiProbeModelSummary(props: {
  readonly deploymentName: string | null;
  readonly modelId: string | null;
  readonly aiSource: string;
  readonly compact?: boolean;
}): React.JSX.Element | null {
  const { deploymentName, modelId, aiSource, compact = false } = props;

  if (deploymentName === null && modelId === null) {
    return null;
  }

  return (
    <div data-testid="review-package-workspace-ai-model">
      {deploymentName !== null ? (
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <InlineMetadataLabel label="Probed deployment" />
          {" "}
          <span className="font-semibold">{deploymentName}</span>
          {modelId !== null ? <span className="text-al-text-secondary"> · model {modelId}</span> : null}
        </p>
      ) : (
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <InlineMetadataLabel label="Probed model" />
          {" "}
          <span className="font-semibold">{modelId}</span>
        </p>
      )}
      {!compact ? (
        <p
          className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="review-package-workspace-ai-model-provenance"
        >
          {resolveProbeProvenanceCopy(aiSource)}
        </p>
      ) : null}
    </div>
  );
}

function WorkspaceAiProbeDiagnostics(props: {
  readonly result: WorkspaceAiAvailabilityResult;
  readonly compact?: boolean;
}): React.JSX.Element {
  const { result, compact = false } = props;
  const deploymentName = resolveProbeDeploymentName(result.debug);
  const modelId = resolveProbeModelId(result.debug);
  const debugEntries = filterProbeDebugMetadata(result.debug, deploymentName);
  const sortedChecks = sortProbeChecks(result.checks);

  return (
    <div className="space-y-2" data-testid="review-package-workspace-ai-debug">
      <WorkspaceAiProbeModelSummary
        deploymentName={deploymentName}
        modelId={modelId}
        aiSource={result.aiSource}
        compact={compact}
      />

      <div>
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Availability checks</p>
        <ul className={cn("m-0 mt-1 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
          {sortedChecks.map((row) => (
            <li key={`${row.name}:${row.status}`} className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-al-text-primary">{buyerLabelForProbeCheckName(row.name)}</span>
              <StatusTag kind={probeCheckStatusKind(row.status)} label={probeCheckStatusLabel(row.status)} />
              {row.detail.trim().length > 0 ? (
                <span className="text-al-text-secondary">{row.detail}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {debugEntries.length > 0 ? (
        <AdvancedOptionsAccordion triggerLabel="Debug metadata" defaultOpen={false}>
          <div className={cn("m-0 grid gap-x-4 gap-y-1 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
            {debugEntries.map(([key, value]) => (
              <InlineMetadataLine key={key} label={key} value={value} className="break-all" />
            ))}
          </div>
        </AdvancedOptionsAccordion>
      ) : null}

      {!compact ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-package-workspace-ai-as-of">
          Validated at {formatInstantForLocale(result.asOfUtc)} · source {result.aiSource}
        </p>
      ) : null}
    </div>
  );
}

/** API-validated workspace AI availability with full probe diagnostics for review failure recovery. */
export function WorkspaceAiAvailabilityPanel(props: WorkspaceAiAvailabilityPanelProps): React.JSX.Element {
  const { workspaceAiSignal, availabilityCheck, reviewTerminalFailure = false, scopingLabel } = props;
  const internalCheck = useWorkspaceAiAvailabilityCheck({
    enabled: availabilityCheck === undefined,
    autoCheck: false,
  });
  const { state, checkAvailability } = availabilityCheck ?? internalCheck;
  const managedBySession = availabilityCheck !== undefined;

  const label =
    state.status === "loaded"
      ? workspaceAiAvailabilityStatusLabel(state.result)
      : workspaceAiSignal.label;

  const detail = resolveWorkspaceAiDetail(state, workspaceAiSignal, managedBySession);

  const liveProbeFailure =
    state.status === "loaded"
      ? state.result.checks.find(
          (row) =>
            row.status === "failed" &&
            (row.name === "azure_openai_live_completion_probe" || row.name === "customer_connection_live_probe"),
        )
      : null;

  const probeLoaded = state.status === "loaded";
  const probeAvailable = probeLoaded && state.result.isAvailable;
  const neutralProbeOnTerminalFailure = reviewTerminalFailure && probeAvailable;
  const terminalFailureScopingCopy =
    neutralProbeOnTerminalFailure
      ? "Live AI is available for this session — it was not the cause of this review failure."
      : null;
  const probeValidatedAt =
    probeLoaded ? formatProbeFreshnessLabel(state.result.asOfUtc) : null;
  const probeTriggerLabel =
    probeLoaded ? buildProbeDetailsTriggerLabel(state.result, probeAvailable) : "AI availability details";
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const workspaceAiProbeDiagnosticsOpenParam = searchParams.get("workspaceAiProbeDiagnosticsOpen");
  const [probeDiagnosticsOpen, setProbeDiagnosticsOpenState] = useState(() =>
    parseWorkspaceAiProbeDiagnosticsOpenFromSearch(workspaceAiProbeDiagnosticsOpenParam),
  );

  const syncProbeDiagnosticsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        workspaceAiProbeDiagnosticsDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setProbeDiagnosticsOpen = useCallback(
    (open: boolean) => {
      setProbeDiagnosticsOpenState(open);
      syncProbeDiagnosticsOpenToUrl(open);
    },
    [syncProbeDiagnosticsOpenToUrl],
  );

  useEffect(() => {
    setProbeDiagnosticsOpenState(
      parseWorkspaceAiProbeDiagnosticsOpenFromSearch(workspaceAiProbeDiagnosticsOpenParam),
    );
  }, [workspaceAiProbeDiagnosticsOpenParam]);

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800",
        probeAvailable && !neutralProbeOnTerminalFailure ? "p-2.5" : "p-3",
      )}
      data-testid="review-package-workspace-ai-availability-panel"
    >
      {scopingLabel !== null && scopingLabel !== undefined && scopingLabel.trim().length > 0 ? (
        <p className={cn("m-0 mb-2 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
          {scopingLabel}
        </p>
      ) : null}
      {terminalFailureScopingCopy !== null ? (
        <p
          className={cn("m-0 mb-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="review-package-workspace-ai-terminal-failure-scope"
        >
          {terminalFailureScopingCopy}
        </p>
      ) : null}
      {probeAvailable ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <StatusTag kind={statusTagKind(state, reviewTerminalFailure, probeAvailable)} label={label} />
            {probeValidatedAt !== null ? (
              <span
                className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="review-package-workspace-ai-checked-at"
                title={probeValidatedAt.absolute}
              >
                {probeValidatedAt.relative}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 min-h-6"
            onClick={() => void checkAvailability({ force: true })}
            data-testid="review-package-recheck-ai-availability-link"
          >
            Re-check
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusTag kind={statusTagKind(state, reviewTerminalFailure, probeAvailable)} label={label} />
              {probeValidatedAt !== null ? (
                <span
                  className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="review-package-workspace-ai-checked-at"
                  title={probeValidatedAt.absolute}
                >
                  {probeValidatedAt.relative}
                </span>
              ) : null}
            </div>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="review-package-workspace-ai-detail">
              {detail}
            </p>
            {state.status === "idle" ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {managedBySession
                  ? "Checks run automatically when you open a failed review."
                  : "Run a live probe before claiming an outage."}
              </p>
            ) : null}
            {state.status === "loading" ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Running a live completion probe (typically a few seconds).
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

          {!probeAvailable ? (
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
          ) : null}
        </div>
      )}

      {probeLoaded && !probeAvailable ? (
        <div className="mt-2 space-y-2">
          <WorkspaceAiProbeModelSummary
            deploymentName={resolveProbeDeploymentName(state.result.debug)}
            modelId={resolveProbeModelId(state.result.debug)}
            aiSource={state.result.aiSource}
            compact
          />
          <ul className={cn("m-0 list-none space-y-1 p-0", OPERATOR_TYPOGRAPHY.helper)}>
            {sortProbeChecks(state.result.checks)
              .filter((row) => probeCheckSortPriority(row.status) <= 1)
              .map((row) => (
                <li key={`${row.name}:${row.status}`} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-al-text-primary">{buyerLabelForProbeCheckName(row.name)}</span>
                  <StatusTag kind={probeCheckStatusKind(row.status)} label={probeCheckStatusLabel(row.status)} />
                  {row.detail.trim().length > 0 ? (
                    <span className="text-al-text-secondary">{row.detail}</span>
                  ) : null}
                </li>
              ))}
          </ul>
          <AdvancedOptionsAccordion
            triggerLabel={probeTriggerLabel}
            open={probeDiagnosticsOpen}
            onOpenChange={setProbeDiagnosticsOpen}
          >
            <WorkspaceAiProbeDiagnostics result={state.result} compact />
          </AdvancedOptionsAccordion>
        </div>
      ) : null}

      {probeLoaded && probeAvailable ? (
        <AdvancedOptionsAccordion
          triggerLabel={probeTriggerLabel}
          open={probeDiagnosticsOpen}
          onOpenChange={setProbeDiagnosticsOpen}
          className="mt-2"
        >
          <WorkspaceAiProbeDiagnostics
            result={state.result}
            compact={!neutralProbeOnTerminalFailure}
          />
        </AdvancedOptionsAccordion>
      ) : null}

      {state.status === "error" ? (
        <p className={cn("m-0 mt-2 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {managedBySession
            ? "Automatic checks could not finish. Use Check AI availability to retry, or open Report a problem if this persists."
            : "Could not validate AI availability. Use Check AI availability to retry, or open Report a problem if this persists."}
        </p>
      ) : null}
    </div>
  );
}
