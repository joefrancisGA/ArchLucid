import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { BulkEvidenceUpload } from "@/components/BulkEvidenceUpload";
import { EvidenceGapForecastPanel } from "@/components/evidence/EvidenceGapForecastPanel";
import {
  BULK_EVIDENCE_UPLOAD_HANDLING_HELPER,
  BULK_EVIDENCE_UPLOAD_HELP_LINKS,
  RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE,
} from "@/lib/bulk-evidence-upload-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { EvidencePresenceFlags } from "@/lib/evidence-gap-forecast";
import type { BulkEvidenceUploadSummary } from "@/lib/bulk-evidence-upload-outcome";

export type RunDetailCaptureEvidenceSectionProps = {
  readonly runId: string;
  /** Retained for call-site compatibility; capture chrome no longer branches on polish mode. */
  readonly buyerPolished?: boolean;
  readonly evidencePresence?: EvidencePresenceFlags;
  readonly onUploadSummary?: (summary: BulkEvidenceUploadSummary) => void;
};

export function RunDetailCaptureEvidenceSection(props: RunDetailCaptureEvidenceSectionProps): ReactElement {
  const { runId } = props;

  return (
    <section
      id="capture-evidence"
      className="scroll-mt-24 space-y-3"
      data-testid="run-detail-capture-evidence-section"
    >
      <div className="space-y-2">
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {RUN_DETAIL_EVIDENCE_CAPTURE_SECTION_TITLE}
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {BULK_EVIDENCE_UPLOAD_HANDLING_HELPER}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {BULK_EVIDENCE_UPLOAD_HELP_LINKS.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? " · " : null}
              <Link href={link.href} className={OPERATOR_LINK.inline}>
                {link.label}
              </Link>
            </span>
          ))}
        </p>
      </div>
      {props.evidencePresence !== undefined ? (
        <EvidenceGapForecastPanel presence={props.evidencePresence} presentation="expandable" />
      ) : null}
      <BulkEvidenceUpload runId={runId} embedded onUploadSummary={props.onUploadSummary} />
    </section>
  );
}
