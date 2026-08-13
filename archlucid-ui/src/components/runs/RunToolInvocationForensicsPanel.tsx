import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { RunToolInvocationForensicsRawCell } from "@/components/runs/RunToolInvocationForensicsRawCell";
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
        <p className={cn("mt-0 max-w-3xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {props.completenessDisclaimer}
        </p>

        {props.hasTraceBlobPersistenceFailure ? (
          <div
            role="status"
            className={cn("rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50", OPERATOR_TYPOGRAPHY.body)}
          >
            <strong>Trace completeness warning:</strong> at least one row has blob upload failure — full
            prompt/response blobs may be missing.
          </div>
        ) : null}

        <EnterpriseTable ariaLabel="Tool and external invocation forensics" className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Invoked (UTC)</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Tool</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Args preview</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Outcome</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Δ prior</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Raw trace</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {props.rows.map((row) => (
              <EnterpriseTableRow key={row.traceId}>
                <EnterpriseTableCell className="align-top whitespace-nowrap">{row.invokedAtUtc}</EnterpriseTableCell>
                <EnterpriseTableCell className="align-top">
                  <div className="font-medium">{row.toolName}</div>
                  <div className={cn("text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{row.taskId}</div>
                </EnterpriseTableCell>
                <EnterpriseTableCell className="max-w-md align-top break-words">{row.argsPreview}</EnterpriseTableCell>
                <EnterpriseTableCell className="align-top">
                  <span>{row.outcome}</span>
                  {row.completenessNote ? (
                    <div className={cn("text-amber-700 dark:text-amber-300", OPERATOR_TYPOGRAPHY.helper)}>{row.completenessNote}</div>
                  ) : null}
                </EnterpriseTableCell>
                <EnterpriseTableCell className="align-top">{formatDuration(row.durationMs)}</EnterpriseTableCell>
                <EnterpriseTableCell className="align-top">
                  <RunToolInvocationForensicsRawCell
                    snapshot={row.traceId ? props.traceRawByTraceId[row.traceId] : undefined}
                  />
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      </CollapsibleSection>
    </div>
  );
}
