import {
  apiPostJson,
  ensureOidcBearerReady,
  resolveRequest,
  throwApiRequestError,
} from "@/lib/api-client";
import { CORRELATION_ID_HEADER, applyTraceParentHeader, captureTraceContextFromResponse } from "@/lib/correlation";
import { ensureCorrelationId } from "@/lib/usability/ensure-correlation-id";

import type { TenantItsmConnectorConnectionResponse } from "./itsm-outbound-connections-settings";

export type ItsmAtlassianOAuthConsentStartRequest = {
  instanceBaseUrl: string;
  redirectUri?: string | null;
  oAuthClientIdKeyVaultSecretName: string;
  oAuthClientSecretKeyVaultSecretName: string;
  oAuthRefreshTokenKeyVaultSecretName: string;
  inboundWebhookKeyVaultSecretName?: string | null;
  label?: string | null;
};

export type ItsmAtlassianOAuthConsentStartResponse = {
  authorizeUrl?: string;
  state?: string;
};

export type ItsmAtlassianOAuthConsentCompleteRequest = {
  code: string;
  state: string;
};

export type ItsmAtlassianOAuthConsentCompleteResponse = {
  refreshTokenStored?: boolean;
  connection?: TenantItsmConnectorConnectionResponse | null;
};

export function buildItsmAtlassianOAuthRedirectUri(): string {
  if (typeof window === "undefined")
    return "/integrations/itsm/oauth/callback";

  return `${window.location.origin}/integrations/itsm/oauth/callback`;
}

export async function startItsmAtlassianOAuthConsent(
  body: ItsmAtlassianOAuthConsentStartRequest,
): Promise<ItsmAtlassianOAuthConsentStartResponse> {
  return apiPostJson<ItsmAtlassianOAuthConsentStartResponse>(
    "/v1/integrations/itsm/connections/jira/oauth/consent/start",
    body,
  );
}

export type ItsmAtlassianOAuthConsentCompleteResult = ItsmAtlassianOAuthConsentCompleteResponse & {
  readonly correlationId: string;
};

export async function completeItsmAtlassianOAuthConsent(
  body: ItsmAtlassianOAuthConsentCompleteRequest,
  options?: { readonly correlationId?: string },
): Promise<ItsmAtlassianOAuthConsentCompleteResult> {
  await ensureOidcBearerReady();
  const { url, headers } = await resolveRequest(
    "/v1/integrations/itsm/connections/jira/oauth/consent/complete",
  );
  const correlationId = ensureCorrelationId(options?.correlationId);
  const requestHeaders = new Headers(headers);
  requestHeaders.set(CORRELATION_ID_HEADER, correlationId);
  applyTraceParentHeader(requestHeaders);
  requestHeaders.set("Content-Type", "application/json");

  const response = await fetch(url, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  captureTraceContextFromResponse(response);
  const text = await response.text();

  if (!response.ok) {
    throwApiRequestError(response, text, correlationId);
  }

  const data = JSON.parse(text) as ItsmAtlassianOAuthConsentCompleteResponse;

  return { ...data, correlationId };
}
