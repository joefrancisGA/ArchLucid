"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useMemo, useState } from "react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ReviewGenerationHandoffRecord } from "@/lib/review-generation-handoff";

export type OperatorRouteDiagnosticsPayload = {
  readonly attemptedRoute: string;
  readonly runId: string | null;
  readonly packageId?: string | null;
  readonly artifactId?: string | null;
  readonly jobId?: string | null;
  readonly workspaceId?: string | null;
  readonly workspaceLabel?: string | null;
  readonly projectId?: string | null;
  readonly httpStatus?: number | null;
  readonly apiEndpoint?: string | null;
  readonly correlationId?: string | null;
  readonly timestampUtc: string;
  readonly failureKind?: string | null;
  readonly backendMessage?: string | null;
  readonly generationJobStatus?: string | null;
  readonly handoff?: ReviewGenerationHandoffRecord | null;
  readonly loadFailure?: ApiLoadFailureState | null;
};

function formatDiagnosticsText(payload: OperatorRouteDiagnosticsPayload): string {
  const lines: string[] = [
    `attemptedRoute: ${payload.attemptedRoute}`,
    `timestampUtc: ${payload.timestampUtc}`,
  ];

  if (payload.runId !== null && payload.runId.length > 0) {
    lines.push(`runId: ${payload.runId}`);
  }

  if (payload.packageId !== null && payload.packageId !== undefined && payload.packageId.length > 0) {
    lines.push(`packageId: ${payload.packageId}`);
  }

  if (payload.artifactId !== null && payload.artifactId !== undefined && payload.artifactId.length > 0) {
    lines.push(`artifactId: ${payload.artifactId}`);
  }

  if (payload.jobId !== null && payload.jobId !== undefined && payload.jobId.length > 0) {
    lines.push(`jobId: ${payload.jobId}`);
  }

  if (payload.workspaceId !== null && payload.workspaceId !== undefined && payload.workspaceId.length > 0) {
    lines.push(`workspaceId: ${payload.workspaceId}`);
  }

  if (payload.projectId !== null && payload.projectId !== undefined && payload.projectId.length > 0) {
    lines.push(`projectId: ${payload.projectId}`);
  }

  if (payload.httpStatus !== null && payload.httpStatus !== undefined) {
    lines.push(`httpStatus: ${payload.httpStatus}`);
  }

  if (payload.apiEndpoint !== null && payload.apiEndpoint !== undefined && payload.apiEndpoint.length > 0) {
    lines.push(`apiEndpoint: ${payload.apiEndpoint}`);
  }

  if (payload.correlationId !== null && payload.correlationId !== undefined && payload.correlationId.length > 0) {
    lines.push(`correlationId: ${payload.correlationId}`);
  }

  if (payload.failureKind !== null && payload.failureKind !== undefined && payload.failureKind.length > 0) {
    lines.push(`failureKind: ${payload.failureKind}`);
  }

  if (payload.generationJobStatus !== null && payload.generationJobStatus !== undefined) {
    lines.push(`generationJobStatus: ${payload.generationJobStatus}`);
  }

  if (payload.backendMessage !== null && payload.backendMessage !== undefined && payload.backendMessage.length > 0) {
    lines.push(`backendMessage: ${payload.backendMessage}`);
  }

  if (payload.handoff !== null && payload.handoff !== undefined) {
    lines.push(`handoffSource: ${payload.handoff.source}`);
    lines.push(`handoffRecordedAtUtc: ${payload.handoff.recordedAtUtc}`);
  }

  return lines.join("\n");
}

export type OperatorRouteDiagnosticsPanelProps = {
  readonly payload: OperatorRouteDiagnosticsPayload;
  readonly defaultOpen?: boolean;
};

export function OperatorRouteDiagnosticsPanel(props: OperatorRouteDiagnosticsPanelProps): React.JSX.Element {
  const { payload, defaultOpen = false } = props;
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);
  const diagnosticsText = useMemo(() => formatDiagnosticsText(payload), [payload]);

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(diagnosticsText);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2_000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-4 rounded-md border border-neutral-200 dark:border-neutral-700">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm" data-testid="open-diagnostics">
            {open ? "Hide error details" : "Open diagnostics"}
          </Button>
        </CollapsibleTrigger>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="copy-diagnostics"
          onClick={() => {
            void copyDiagnostics();
          }}
        >
          {copied ? "Copied diagnostics" : "Copy diagnostics"}
        </Button>
      </div>
      <CollapsibleContent className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-700">
        <dl className={cn("m-0 grid gap-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          <DiagnosticRow label="Attempted route" value={payload.attemptedRoute} />
          <DiagnosticRow label="Review ID" value={payload.runId} />
          {payload.packageId ? <DiagnosticRow label="Review ID" value={payload.packageId} /> : null}
          {payload.jobId ? <DiagnosticRow label="Job ID" value={payload.jobId} /> : null}
          {payload.workspaceId ? <DiagnosticRow label="Workspace ID" value={payload.workspaceId} /> : null}
          {payload.projectId ? <DiagnosticRow label="Project ID" value={payload.projectId} /> : null}
          {payload.httpStatus !== null && payload.httpStatus !== undefined ? (
            <DiagnosticRow label="HTTP status" value={String(payload.httpStatus)} />
          ) : null}
          {payload.apiEndpoint ? <DiagnosticRow label="API endpoint" value={payload.apiEndpoint} /> : null}
          {payload.correlationId ? (
            <div className="flex flex-wrap items-center gap-2">
              <dt className="font-semibold">Correlation ID</dt>
              <dd className="m-0 flex flex-wrap items-center gap-1">
                <code className="break-all rounded bg-neutral-100 px-1 py-0.5 font-mono dark:bg-neutral-800">
                  {payload.correlationId}
                </code>
                <CopyIdButton value={payload.correlationId} aria-label="Copy correlation ID" />
              </dd>
            </div>
          ) : null}
          <DiagnosticRow label="Timestamp (UTC)" value={payload.timestampUtc} />
          {payload.failureKind ? <DiagnosticRow label="Failure kind" value={payload.failureKind} /> : null}
          {payload.backendMessage ? <DiagnosticRow label="Backend message" value={payload.backendMessage} /> : null}
          {payload.generationJobStatus ? (
            <DiagnosticRow label="Generation job status" value={payload.generationJobStatus} />
          ) : null}
        </dl>
      </CollapsibleContent>
    </Collapsible>
  );
}

function DiagnosticRow(props: { readonly label: string; readonly value: string | null | undefined }) {
  const trimmed = props.value?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  return (
    <div>
      <dt className="font-semibold">{props.label}</dt>
      <dd className="m-0 break-all font-mono">{trimmed}</dd>
    </div>
  );
}
