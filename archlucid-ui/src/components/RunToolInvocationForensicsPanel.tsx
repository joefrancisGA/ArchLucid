import { CollapsibleSection } from "@/components/CollapsibleSection";
import { RunToolInvocationForensicsRawCell } from "@/components/RunToolInvocationForensicsRawCell";
import type { AgentTraceRawSnapshot, RunToolInvocationForensicRow } from "@/types/agent-forensics";

export type RunToolInvocationForensicsPanelProps = {
  readonly hasTraceBlobPersistenceFailure: boolean;
  readonly completenessDisclaimer: string;
  readonly rows: readonly RunToolInvocationForensicRow[];
  readonly traceRawByTraceId: Readonly<Record<string, AgentTraceRawSnapshot>>;
};

function formatDuration(durationMs: number | null | undefined): string {
  if (durationMs === null || durationMs === undefined || Number.isNaN(durationMs)) {
    return "—";
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  const sec = Math.round(durationMs / 1000);

  if (sec < 60) {
    return `${sec}s`;
  }

  const m = Math.floor(sec / 60);
  const s = sec % 60;

  return `${m}m ${s}s`;
}

/** TB-110: structured ledger or trace-derived invocation table with execute-gated raw preview. */
export function RunToolInvocationForensicsPanel(props: RunToolInvocationForensicsPanelProps) {
  if (props.rows.length === 0) {
    return null;
  }

  return (
    <div id="tool-invocation-forensics" className="scroll-mt-24">
      <CollapsibleSection title="Tool and external invocation forensics (diagnostics)" defaultOpen={false}>
        <p className="mt-0 max-w-3xl text-sm text-neutral-500 dark:text-neutral-400">
          {props.completenessDisclaimer}
        </p>

        {props.hasTraceBlobPersistenceFailure ? (
          <div
            role="status"
            className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50"
          >
            <strong>Trace completeness warning:</strong> at least one row has blob upload failure — full
            prompt/response blobs may be missing.
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="mt-2 w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b text-neutral-600 dark:text-neutral-300">
                <th className="py-2 pr-3 font-medium">Invoked (UTC)</th>
                <th className="py-2 pr-3 font-medium">Tool</th>
                <th className="py-2 pr-3 font-medium">Args preview</th>
                <th className="py-2 pr-3 font-medium">Outcome</th>
                <th className="py-2 pr-3 font-medium">Δ prior</th>
              </tr>
            </thead>
            <tbody>
              {props.rows.map((row) => (
                <tr key={row.traceId} className="border-b border-neutral-200/60 dark:border-neutral-700/60">
                  <td className="py-2 pr-3 align-top whitespace-nowrap">{row.invokedAtUtc}</td>
                  <td className="py-2 pr-3 align-top">
                    <div className="font-medium">{row.toolName}</div>
                    <div className="text-xs text-neutral-500">{row.taskId}</div>
                  </td>
                  <td className="py-2 pr-3 align-top max-w-md break-words">{row.argsPreview}</td>
                  <td className="py-2 pr-3 align-top">
                    <span>{row.outcome}</span>
                    {row.completenessNote ? (
                      <div className="text-xs text-amber-700 dark:text-amber-300">{row.completenessNote}</div>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 align-top">{formatDuration(row.durationMs)}</td>
                  <td className="py-2 pr-3 align-top">
                    <RunToolInvocationForensicsRawCell
                      snapshot={
                        row.traceId ? props.traceRawByTraceId[row.traceId] : undefined
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}
