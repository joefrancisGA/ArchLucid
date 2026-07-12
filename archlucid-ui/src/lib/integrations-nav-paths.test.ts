import { describe, expect, it } from "vitest";

import {
  CLOUD_CONNECTIONS_PATH,
  INTEGRATIONS_READINESS_PATH,
  LEGACY_CLOUD_CONNECTIONS_PATH,
  LEGACY_INTEGRATIONS_ITSM_PATH,
  LEGACY_INTEGRATIONS_OPERATIONS_PATH,
  pathMatchesCloudConnections,
  pathMatchesIntegrationsReadiness,
} from "@/lib/integrations-nav-paths";

describe("integrations-nav-paths (TB-407 / TB-408 / TB-750)", () => {
  it("exposes canonical integrations paths under /integrations/*", () => {
    expect(CLOUD_CONNECTIONS_PATH).toBe("/integrations/cloud-connections");
    expect(INTEGRATIONS_READINESS_PATH).toBe("/integrations/readiness");
    expect(LEGACY_INTEGRATIONS_OPERATIONS_PATH).toBe("/integrations/operations");
  });

  it("matches canonical and legacy cloud-connections paths", () => {
    expect(pathMatchesCloudConnections("/integrations/cloud-connections")).toBe(true);
    expect(pathMatchesCloudConnections("/settings/cloud-connections")).toBe(true);
  });

  it("matches integration readiness, operations, and legacy ITSM redirect sources", () => {
    expect(pathMatchesIntegrationsReadiness("/integrations/readiness")).toBe(true);
    expect(pathMatchesIntegrationsReadiness("/integrations/operations")).toBe(true);
    expect(pathMatchesIntegrationsReadiness("/integrations/itsm")).toBe(true);
  });

  it("documents legacy redirect sources", () => {
    expect(LEGACY_CLOUD_CONNECTIONS_PATH).toBe("/settings/cloud-connections");
    expect(LEGACY_INTEGRATIONS_ITSM_PATH).toBe("/integrations/itsm");
  });
});
