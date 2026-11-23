import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import { proxyJsonGet, proxyJsonPut } from "@/lib/proxy-json-client";

const PATHS_PATH = "/api/proxy/v1/operational-security/paths";

function mapTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapOptionalTrimmedString(value: unknown): string | null {
  const mapped = mapTrimmedString(value);

  return mapped.length > 0 ? mapped : null;
}

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
    pathId: mapTrimmedString(raw.pathId),
    outcome: mapTrimmedString(raw.outcome),
    rationale: mapTrimmedString(raw.rationale),
    recordedUtc: mapTrimmedString(raw.recordedUtc),
  };
}

function pilotDispositionPath(pathId: string): string {
  // Path inspect puts this id in a query. A slash must stay one path segment.
  return `${PATHS_PATH}/${encodeURIComponent(pathId)}/pilot-disposition`;
}

export async function fetchSecureNowPilotPathDisposition(
  pathId: string,
): Promise<SecureNowPilotPathDispositionServerRecord | null> {
  const trimmed = pathId.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const raw = await proxyJsonGet<Record<string, unknown>>(`${pilotDispositionPath(trimmed)}`);
    const disposition = mapDisposition(raw);

    return disposition.pathId.length > 0 && disposition.outcome.length > 0 ? disposition : null;
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
  const raw = await proxyJsonPut<Record<string, unknown>>(`${pilotDispositionPath(trimmed)}`, body);
  const dispositionRaw = raw.disposition as Record<string, unknown> | null | undefined;

  return {
    succeeded: raw.succeeded === true,
    errorMessage: mapOptionalTrimmedString(raw.errorMessage),
    disposition:
      dispositionRaw == null
      || typeof dispositionRaw.pathId !== "string"
      || dispositionRaw.pathId.trim().length === 0
      || typeof dispositionRaw.outcome !== "string"
      || dispositionRaw.outcome.trim().length === 0
        ? null
        : mapDisposition(dispositionRaw),
  };
}
