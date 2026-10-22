import { AuditEvidenceControlLineageClient } from "./AuditEvidenceControlLineageClient";

type AuditEvidenceControlLineagePageProps = {
  params: Promise<{
    assessmentId: string;
    snapshotId: string;
    controlId: string;
  }>;
};

/** AE-10 audit control detail — clickable positive checkbox opens chain of custody. */
export default async function AuditEvidenceControlLineagePage(props: AuditEvidenceControlLineagePageProps) {
  const params = await props.params;

  return (
    <AuditEvidenceControlLineageClient
      assessmentId={params.assessmentId}
      snapshotId={params.snapshotId}
      controlId={params.controlId}
    />
  );
}
