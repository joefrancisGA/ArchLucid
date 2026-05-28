import { CollapsibleSection } from "@/components/CollapsibleSection";

export type RunToolInvocationForensicsPanelProps = {
  readonly hasTraceBlobPersistenceFailure: boolean;
};

/**
 * V1 does not persist a structured tool-call log yet. This panel prevents operators from mistaking
 * raw prompt/response trace availability for a redacted external-invocation ledger.
 */
export function RunToolInvocationForensicsPanel(props: RunToolInvocationForensicsPanelProps) {
  return (
    <div id="tool-invocation-forensics" className="scroll-mt-24">
      <CollapsibleSection title="Tool and external invocation forensics (diagnostics)" defaultOpen={false}>
        <p className="mt-0 max-w-3xl text-sm text-neutral-500 dark:text-neutral-400">
          Structured tool-call and external-invocation rows are not recorded for this run. Do not infer tool
          arguments, response bodies, retry behavior, or duration from raw prompts.
        </p>

        {props.hasTraceBlobPersistenceFailure ? (
          <div
            role="status"
            className="rounded-lg border border-amber-400 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
          >
            Full trace completeness is degraded because at least one prompt/response blob failed to persist.
          </div>
        ) : (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Full agent traces may still be available through the existing trace/audit path, but no safe structured
            invocation ledger exists yet.
          </p>
        )}
      </CollapsibleSection>
    </div>
  );
}
