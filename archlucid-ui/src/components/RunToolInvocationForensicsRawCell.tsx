"use client";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import type { AgentTraceRawSnapshot } from "@/types/agent-forensics";

const RAW_PREVIEW_MAX_CHARS = 4000;

type RunToolInvocationForensicsRawCellProps = {
  readonly snapshot: AgentTraceRawSnapshot | undefined;
};

function truncateForDisplay(value: string): { text: string; truncated: boolean } {
  const trimmed = value.trim();

  if (trimmed.length <= RAW_PREVIEW_MAX_CHARS) {
    return { text: trimmed, truncated: false };
  }

  return {
    text: `${trimmed.slice(0, RAW_PREVIEW_MAX_CHARS)}…`,
    truncated: true,
  };
}

function RawField(props: { readonly label: string; readonly value: string | null | undefined }) {
  if (props.value === null || props.value === undefined || props.value.trim().length === 0) {
    return (
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        <span className="font-medium text-neutral-600 dark:text-neutral-300">{props.label}:</span> (empty)
      </p>
    );
  }

  const { text, truncated } = truncateForDisplay(props.value);

  return (
    <div>
      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">{props.label}</p>
      <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded border border-neutral-200/80 bg-neutral-50 px-2 py-1.5 font-mono text-[11px] text-neutral-800 dark:border-neutral-700/80 dark:bg-neutral-900/60 dark:text-neutral-200">
        {text}
      </pre>
      {truncated ? (
        <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          Preview truncated for UI safety; full text may be in durable blob storage when blob upload succeeded.
        </p>
      ) : null}
    </div>
  );
}

/**
 * TB-110: inline redacted prompt/response preview for execute-tier operators (API policy remains authoritative).
 */
export function RunToolInvocationForensicsRawCell(props: RunToolInvocationForensicsRawCellProps) {
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const canViewRaw = !isAuthorityLoading && callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;

  if (!canViewRaw) {
    return (
      <span className="text-xs text-neutral-500 dark:text-neutral-400" title="Execute authority required">
        Restricted
      </span>
    );
  }

  if (!props.snapshot) {
    return <span className="text-xs text-neutral-500 dark:text-neutral-400">No trace row</span>;
  }

  const hasAny =
    (props.snapshot.userPrompt?.trim().length ?? 0) > 0 ||
    (props.snapshot.rawResponse?.trim().length ?? 0) > 0 ||
    (props.snapshot.systemPrompt?.trim().length ?? 0) > 0 ||
    (props.snapshot.parsedResultJson?.trim().length ?? 0) > 0;

  if (!hasAny) {
    return <span className="text-xs text-neutral-500 dark:text-neutral-400">No inline text</span>;
  }

  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-al-accent hover:underline">View raw</summary>
      <div className="mt-2 max-w-lg space-y-2 rounded border border-neutral-200/80 bg-al-surface-raised p-2 dark:border-neutral-700/80">
        <RawField label="User prompt (redacted)" value={props.snapshot.userPrompt} />
        <RawField label="Raw response (redacted)" value={props.snapshot.rawResponse} />
        <RawField label="System prompt (redacted)" value={props.snapshot.systemPrompt} />
        <RawField label="Parsed JSON" value={props.snapshot.parsedResultJson} />
      </div>
    </details>
  );
}
