import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";

export function formatSecureNowPilotDispositionTenantAuditRecordedLine(recordedUtc: string): string | null {
  const trimmed = recordedUtc.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const display = formatIsoUtcForDisplay(trimmed);

  if (display.length === 0) {
    return "Tenant audit record id: time was not stored.";
  }

  return `Tenant audit recorded at ${display} UTC.`;
}