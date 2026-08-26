import {
  buildDigestExportFile,
  type DigestExportFile,
} from "@/lib/digest-delivery-presentation";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";

export function uniqueRecipients(attempts: readonly DigestDeliveryAttempt[]): string {
  const destinations: string[] = [
    ...new Set(
      attempts
        .map((a) => a.destination?.trim())
        .filter((d): d is string => d !== undefined && d.length > 0),
    ),
  ];

  if (destinations.length === 0) {
    return " — ";
  }

  if (destinations.length <= 2) {
    return destinations.join(", ");
  }

  return `${destinations.slice(0, 2).join(", ")} +${destinations.length - 2}`;
}

/**
 * Saves the digest body to disk. The anchor is attached to the document and the
 * object URL is released on the next task so Firefox and Safari finish the
 * download before the blob is revoked.
 */
export function downloadDigestExport(digest: ArchitectureDigest): void {
  const file: DigestExportFile = buildDigestExportFile(digest);
  const blob = new Blob([file.contents], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
