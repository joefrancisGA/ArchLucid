import { DEFAULT_IANA_TIME_ZONE_ID } from "@/lib/default-iana-time-zone";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import { formatInstantInPreferredTimeZone } from "@/lib/locale-datetime";

export function formatInfraEvidenceSnapshotCapturedUtcLabel(
  capturedUtc: string | null | undefined,
): string | null {
  if (capturedUtc == null || capturedUtc.trim().length === 0) {
    return null;
  }

  const ms = parseIsoUtcMs(capturedUtc.trim());

  if (!Number.isFinite(ms)) {
    return null;
  }

  const instant = new Date(ms);

  return (
    instant.toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }) + " UTC"
  );
}

export function resolveInfraEvidenceSnapshotCapturedTimeIso(
  capturedUtc: string | null | undefined,
): string | null {
  if (capturedUtc == null || capturedUtc.trim().length === 0) {
    return null;
  }

  const ms = parseIsoUtcMs(capturedUtc.trim());

  if (!Number.isFinite(ms)) {
    return null;
  }

  return capturedUtc.trim();
}

export function formatInfraEvidenceSnapshotCapturedTimeTitle(
  capturedUtc: string | null | undefined,
  ianaTimeZoneId: string = DEFAULT_IANA_TIME_ZONE_ID,
): string {
  const local = formatInstantInPreferredTimeZone(capturedUtc, ianaTimeZoneId);
  const utc = formatInfraEvidenceSnapshotCapturedUtcLabel(capturedUtc);

  if (utc == null) {
    return local;
  }

  return `${local} · ${utc}`;
}
