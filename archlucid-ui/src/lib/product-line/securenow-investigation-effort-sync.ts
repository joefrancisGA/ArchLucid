import {
  fetchSecureNowInvestigationEffortInputs,
  saveSecureNowInvestigationEffortInputs,
} from "@/lib/product-line/securenow-investigation-effort-api";
import {
  isSecureNowInvestigationEffortAuditCandidate,
  persistSecureNowInvestigationEffortInputs,
  readSecureNowInvestigationEffortInputs,
  type SecureNowInvestigationEffortInputFields,
} from "@/lib/product-line/securenow-investigation-effort-input-storage";

export async function loadSecureNowInvestigationEffortInputs(): Promise<SecureNowInvestigationEffortInputFields | null> {
  try {
    const server = await fetchSecureNowInvestigationEffortInputs();

    if (server !== null) {
      persistSecureNowInvestigationEffortInputs(server);
      return server;
    }
  } catch {
    // Fall back to the browser cache when the audit read is unavailable.
  }

  return readSecureNowInvestigationEffortInputs();
}

export async function persistSecureNowInvestigationEffortInputsToAudit(
  fields: SecureNowInvestigationEffortInputFields,
): Promise<string | null> {
  if (!isSecureNowInvestigationEffortAuditCandidate(fields)) {
    return null;
  }

  try {
    return await saveSecureNowInvestigationEffortInputs(fields);
  } catch {
    return "Investigation effort input save failed.";
  }
}
