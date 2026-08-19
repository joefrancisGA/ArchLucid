import {
  buildItsmAtlassianOAuthRedirectUri,
  startItsmAtlassianOAuthConsent,
  type TenantItsmConnectorConnectionResponse,
} from "@/lib/api/itsm-outbound-api";

import { isJiraAtlassianOAuthConnectReady } from "./jira-integration-present";

export async function launchJiraAtlassianOAuthConnect(
  connection: TenantItsmConnectorConnectionResponse,
): Promise<void> {
  if (!isJiraAtlassianOAuthConnectReady(connection)) {
    throw new Error("OAuth client references are not ready for Atlassian consent.");
  }

  const response = await startItsmAtlassianOAuthConsent({
    instanceBaseUrl: connection.instanceBaseUrl!.trim(),
    redirectUri: buildItsmAtlassianOAuthRedirectUri(),
    oAuthClientIdKeyVaultSecretName: connection.oAuthClientIdKeyVaultSecretName!.trim(),
    oAuthClientSecretKeyVaultSecretName: connection.oAuthClientSecretKeyVaultSecretName!.trim(),
    oAuthRefreshTokenKeyVaultSecretName: connection.oAuthRefreshTokenKeyVaultSecretName!.trim(),
    inboundWebhookKeyVaultSecretName: connection.inboundWebhookKeyVaultSecretName ?? undefined,
    label: connection.label ?? undefined,
  });

  const authorizeUrl = response.authorizeUrl?.trim();

  if (authorizeUrl === undefined || authorizeUrl.length === 0) {
    throw new Error("Atlassian authorization URL was not returned.");
  }

  window.location.assign(authorizeUrl);
}
