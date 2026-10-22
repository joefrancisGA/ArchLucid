import { AuditEvidenceControlLineageClient } from "@/app/(operator)/governance/audit-evidence/[assessmentId]/snapshots/[snapshotId]/controls/[controlId]/AuditEvidenceControlLineageClient";

type SecureNowAuditEvidenceControlLineagePageProps = {
  params: Promise<{
    assessmentId: string;
    snapshotId: string;
    controlId: string;
  }>;
};

/** SecureNow audit control detail — chain of custody. */
export default async function SecureNowAuditEvidenceControlLineagePage(
  props: SecureNowAuditEvidenceControlLineagePageProps,
) {
  const params = await props.params;

  return (
    <AuditEvidenceControlLineageClient
      assessmentId={params.assessmentId}
      snapshotId={params.snapshotId}
      controlId={params.controlId}
    />
  );
}
