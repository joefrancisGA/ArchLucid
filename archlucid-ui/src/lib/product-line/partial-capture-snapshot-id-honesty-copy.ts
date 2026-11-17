import { SECURENOW_FINDINGS_HEADER_PARTIAL_CAPTURE_LINE } from "@/lib/governance/findings-header-partial-capture-honesty-copy";

export function formatPartialCaptureWithSnapshotIdLine(snapshotId: string | null | undefined): string {
  const id = snapshotId?.trim() ?? "";

  if (id.length === 0) {
    return SECURENOW_FINDINGS_HEADER_PARTIAL_CAPTURE_LINE;
  }

  return `${SECURENOW_FINDINGS_HEADER_PARTIAL_CAPTURE_LINE} Latest partial capture snapshot: ${id}.`;
}