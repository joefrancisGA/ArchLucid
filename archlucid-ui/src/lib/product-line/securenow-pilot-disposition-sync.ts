import {
  fetchSecureNowPilotPathDisposition,
  saveSecureNowPilotPathDisposition,
} from "@/lib/product-line/securenow-pilot-disposition-api";
import {
  readSecureNowPilotDisposition,
  writeSecureNowPilotDisposition,
  type SecureNowPilotDispositionRecord,
} from "@/lib/product-line/securenow-pilot-disposition-storage";

export async function loadSecureNowPilotDispositionForPath(
  pathId: string,
): Promise<SecureNowPilotDispositionRecord | null> {
  const trimmed = pathId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const server = await fetchSecureNowPilotPathDisposition(trimmed);

    if (server !== null) {
      const record = { outcome: server.outcome, rationale: server.rationale };
      writeSecureNowPilotDisposition(trimmed, record);
      return record;
    }
  } catch {
    // Fall back to browser cache when audit read is unavailable.
  }

  return readSecureNowPilotDisposition(trimmed);
}

export async function persistSecureNowPilotDispositionForPath(
  pathId: string,
  record: SecureNowPilotDispositionRecord,
): Promise<string | null> {
  const trimmed = pathId.trim();

  if (trimmed.length === 0) {
    return "Path id is required.";
  }

  try {
    const result = await saveSecureNowPilotPathDisposition(trimmed, record);

    if (!result.succeeded) {
      return result.errorMessage ?? "Path disposition save failed.";
    }
  } catch {
    return "Path disposition save failed.";
  }

  writeSecureNowPilotDisposition(trimmed, record);
  return null;
}
