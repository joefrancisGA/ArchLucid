import { describe, expect, it } from "vitest";

import {
  ADMINISTRATION_CONNECTION_STATUS_PATH,
  CLOUD_CONNECTIONS_PATH,
  INTEGRATIONS_READINESS_PATH,
  ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH,
  LEGACY_CLOUD_CONNECTIONS_PATH,
  REMOVED_INTEGRATIONS_ITSM_HUB_PATH,
  pathMatchesCloudConnections,
  pathMatchesIntegrationsReadiness,
} from "@/lib/integrations-nav-paths";

describe("integrations-nav-paths (TB-407 / TB-408 / TB-750)", () => {
  it("exposes canonical connection-status and integrations product paths", () => {
    expect(CLOUD_CONNECTIONS_PATH).toBe("/integrations/cloud-connections");
    expect(ADMINISTRATION_CONNECTION_STATUS_PATH).toBe("/administration/connection-status");
    expect(INTEGRATIONS_READINESS_PATH).toBe(ADMINISTRATION_CONNECTION_STATUS_PATH);
  });

  it("matches canonical and legacy cloud-connections paths", () => {
    expect(pathMatchesCloudConnections("/integrations/cloud-connections")).toBe(true);
    expect(pathMatchesCloudConnections("/settings/cloud-connections")).toBe(true);
  });

  it("matches only the canonical connection-status path", () => {
    expect(pathMatchesIntegrationsReadiness("/administration/connection-status")).toBe(true);
    expect(pathMatchesIntegrationsReadiness("/integrations/readiness")).toBe(false);
    expect(pathMatchesIntegrationsReadiness("/integrations/operations")).toBe(false);
    expect(pathMatchesIntegrationsReadiness("/integrations/itsm")).toBe(false);
  });

  it("documents removed hub vs live OAuth callback", () => {
    expect(LEGACY_CLOUD_CONNECTIONS_PATH).toBe("/settings/cloud-connections");
    expect(REMOVED_INTEGRATIONS_ITSM_HUB_PATH).toBe("/integrations/itsm");
    expect(ITSM_ATLASSIAN_OAUTH_CALLBACK_PATH).toBe("/integrations/itsm/oauth/callback");
  });
});
