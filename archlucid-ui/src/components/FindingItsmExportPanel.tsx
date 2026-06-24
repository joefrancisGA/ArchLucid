import { CopyFindingAsWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import type { FindingInspectPayload } from "@/types/finding-inspect";

export type FindingItsmExportPanelProps = {
  runId: string;
  findingId: string;
  payload: FindingInspectPayload;
};

/** Above-the-fold copy seam for external ticketing on finding detail pages. */
export function FindingItsmExportPanel({ runId, findingId, payload }: FindingItsmExportPanelProps) {
  return (
    <section
      className="rounded-lg border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/30"
      aria-labelledby="finding-itsm-export-heading"
      data-testid="finding-itsm-export-panel"
    >
      <h2
        id="finding-itsm-export-heading"
        className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100"
      >
        Copy for Jira or ServiceNow
      </h2>
      <p className="m-0 mt-2 text-sm text-neutral-700 dark:text-neutral-300">
        One click copies Jira wiki markup ready to paste into a ticket. Choose ServiceNow or JSON for other trackers.
      </p>
      <div className="pt-3">
        <CopyFindingAsWorkItemButton findingId={findingId} payload={payload} runId={runId} prominent />
      </div>
    </section>
  );
}
