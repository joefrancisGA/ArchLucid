import { cn } from "@/lib/utils";
import type { ReactElement } from "react";
import { BulkEvidenceUpload } from "@/components/BulkEvidenceUpload";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type RunDetailCaptureEvidenceSectionProps = {
  readonly runId: string;
  readonly buyerPolished: boolean;
};

export function RunDetailCaptureEvidenceSection(props: RunDetailCaptureEvidenceSectionProps): ReactElement {
  const { runId, buyerPolished } = props;

  return (
    <section id="capture-evidence" className="scroll-mt-24">
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
        <div className={cn("border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50", OPERATOR_CARD.header)}>
          <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {buyerPolished ? "Capture evidence" : "Add evidence"}
          </h3>
        </div>
        <div className={OPERATOR_CARD.body}>
          <BulkEvidenceUpload runId={runId} />
        </div>
      </div>
    </section>
  );
}
