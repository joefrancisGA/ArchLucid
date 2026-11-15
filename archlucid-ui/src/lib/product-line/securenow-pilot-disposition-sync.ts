import {
  fetchSecureNowPilotPathDisposition,
  saveSecureNowPilotPathDisposition,
} from "@/lib/product-line/securenow-pilot-disposition-api";
import {
  readSecureNowPilotDisposition,
  writeSecureNowPilotDisposition,
  type SecureNowPilotDispositionRecord,
} from "@/lib/product-line/securenow-pilot-disposition-storage";

export type SecureNowPilotDispositionPersistOutcome =
  | { readonly status: "saved"; readonly tenantAuditRecorded: true; readonly recordedUtc: string | null }
  | { readonly status: "error"; readonly errorMessage: string };

export type SecureNowPilotDispositionLoaded = {
  readonly record: SecureNowPilotDispositionRecord;
  readonly recordedUtc: string | null;
};

export async function loadSecureNowPilotDispositionForPath(
  pathId: string,
): Promise<SecureNowPilotDispositionLoaded | null> {
  const trimmed = pathId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const server = await fetchSecureNowPilotPathDisposition(trimmed);

    if (server !== null) {
      const record = { outcome: server.outcome, rationale: server.rationale };
      writeSecureNowPilotDisposition(trimmed, record);

      const recordedUtc = server.recordedUtc.trim().length > 0 ? server.recordedUtc.trim() : null;

      return { record, recordedUtc };
    }
  } catch {
    // Fall back to browser cache when audit read is unavailable.
  }

  const cached = readSecureNowPilotDisposition(trimmed);

  if (cached === null) {
    return null;
  }

  return { record: cached, recordedUtc: null };
}

export async function persistSecureNowPilotDispositionForPath(
  pathId: string,
  record: SecureNowPilotDispositionRecord,
): Promise<SecureNowPilotDispositionPersistOutcome> {
  const trimmed = pathId.trim();

  if (trimmed.length === 0) {
    return { status: "error", errorMessage: "Path id is required." };
  }

  try {
    const result = await saveSecureNowPilotPathDisposition(trimmed, record);

    if (!result.succeeded) {
      return { status: "error", errorMessage: result.errorMessage ?? "Path disposition save failed." };
    }

    writeSecureNowPilotDisposition(trimmed, record);
    const recordedUtc = result.disposition?.recordedUtc?.trim() ?? null;

    return {
      status: "saved",
      tenantAuditRecorded: true,
      recordedUtc: recordedUtc != null && recordedUtc.length > 0 ? recordedUtc : null,
    };
  } catch {
    return { status: "error", errorMessage: "Path disposition save failed." };
  }
}
