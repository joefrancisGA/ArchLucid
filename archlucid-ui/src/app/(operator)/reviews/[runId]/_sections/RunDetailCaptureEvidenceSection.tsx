import type { ReactElement } from "react";
import { BulkEvidenceUpload } from "@/components/BulkEvidenceUpload";

export type RunDetailCaptureEvidenceSectionProps = {
  readonly runId: string;
  readonly buyerPolished: boolean;
};

export function RunDetailCaptureEvidenceSection(props: RunDetailCaptureEvidenceSectionProps): ReactElement {
  const { runId, buyerPolished } = props;

  return (
    <section id="capture-evidence" className="scroll-mt-24">
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          <h3 className="m-0 text-sm font-semibold text-al-text-primary">
            {buyerPolished ? "Capture evidence" : "Add evidence"}
          </h3>
        </div>
        <div className="p-4">
          <BulkEvidenceUpload runId={runId} />
        </div>
      </div>
    </section>
  );
}
