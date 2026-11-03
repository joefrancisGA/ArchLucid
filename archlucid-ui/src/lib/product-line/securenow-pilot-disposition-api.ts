import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { proxyJsonGet, proxyJsonPut } from "@/lib/proxy-json-client";

const PATHS_PATH = "/api/proxy/v1/operational-security/paths";

export type SecureNowPilotPathDispositionServerRecord = {
  readonly pathId: string;
  readonly outcome: string;
  readonly rationale: string;
  readonly recordedUtc: string;
};

export type SecureNowPilotPathDispositionSaveResult = {
  readonly succeeded: boolean;
  readonly errorMessage: string | null;
  readonly disposition: SecureNowPilotPathDispositionServerRecord | null;
};

function mapDisposition(raw: Record<string, unknown>): SecureNowPilotPathDispositionServerRecord {
  return {
    pathId: String(raw.pathId ?? ""),
    outcome: String(raw.outcome ?? ""),
    rationale: String(raw.rationale ?? ""),
    recordedUtc: String(raw.recordedUtc ?? ""),
  };
}

export async function fetchSecureNowPilotPathDisposition(
  pathId: string,
): Promise<SecureNowPilotPathDispositionServerRecord | null> {
  const trimmed = pathId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const raw = await proxyJsonGet<Record<string, unknown>>(`${PATHS_PATH}/${trimmed}/pilot-disposition`);
    return mapDisposition(raw);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);

    if (isApiNotFoundFailure(failure)) {
      return null;
    }

    throw error;
  }
}

export async function saveSecureNowPilotPathDisposition(
  pathId: string,
  body: { readonly outcome: string; readonly rationale: string },
): Promise<SecureNowPilotPathDispositionSaveResult> {
  const trimmed = pathId.trim();
  const raw = await proxyJsonPut<Record<string, unknown>>(`${PATHS_PATH}/${trimmed}/pilot-disposition`, body);
  const dispositionRaw = raw.disposition as Record<string, unknown> | null | undefined;

  return {
    succeeded: raw.succeeded === true,
    errorMessage: raw.errorMessage != null ? String(raw.errorMessage) : null,
    disposition: dispositionRaw == null ? null : mapDisposition(dispositionRaw),
  };
}
