/** ITSM outbound connections API surface (barrel). */

export type { ItsmIntegrationHealthResponse } from "./itsm-outbound-connections-health";
export {
  fetchItsmIntegrationHealth,
  fetchItsmProviderPageBundle,
  probeItsmIntegrationHealth,
} from "./itsm-outbound-connections-health";

export type {
  TenantItsmConnectorConnectionResponse,
  TenantItsmConnectorConnectionUpsertRequest,
  TenantItsmDeploymentCredentialSummary,
  TenantItsmOutboundSettingsResponse,
  TenantItsmOutboundSettingsUpsertRequest,
} from "./itsm-outbound-connections-settings";
export {
  deleteTenantItsmConnectorConnection,
  fetchTenantItsmConnectorConnection,
  fetchTenantItsmOutboundSettings,
  upsertTenantItsmConnectorConnection,
  upsertTenantItsmOutboundSettings,
} from "./itsm-outbound-connections-settings";

export type {
  ItsmAtlassianOAuthConsentCompleteRequest,
  ItsmAtlassianOAuthConsentCompleteResponse,
  ItsmAtlassianOAuthConsentCompleteResult,
  ItsmAtlassianOAuthConsentStartRequest,
  ItsmAtlassianOAuthConsentStartResponse,
} from "./itsm-outbound-connections-oauth";
export {
  buildItsmAtlassianOAuthRedirectUri,
  completeItsmAtlassianOAuthConsent,
  startItsmAtlassianOAuthConsent,
} from "./itsm-outbound-connections-oauth";
