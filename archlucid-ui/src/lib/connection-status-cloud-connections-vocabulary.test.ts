import { describe, expect, it } from "vitest";

import {
  CONNECTION_STATUS_CLOUD_CONNECTIONS_CLOUD_LINK,
  CONNECTION_STATUS_CLOUD_CONNECTIONS_COMPACT_LINE,
  CONNECTION_STATUS_CLOUD_CONNECTIONS_HEADING,
  CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK,
  CONNECTION_STATUS_CLOUD_CONNECTIONS_WHY_TWO,
  buildConnectionStatusCloudConnectionsVocabulary,
  resolveConnectionStatusCloudConnectionsPeerLink,
} from "@/lib/connection-status-cloud-connections-vocabulary";
import {
  ADMINISTRATION_CONNECTION_STATUS_PATH,
  CLOUD_CONNECTIONS_PATH,
} from "@/lib/integrations-nav-paths";

describe("connection-status-cloud-connections-vocabulary (TB-2245)", () => {
  it("explains why two connection surfaces exist and deep-links both", () => {
    const model = buildConnectionStatusCloudConnectionsVocabulary();

    expect(model.heading).toBe(CONNECTION_STATUS_CLOUD_CONNECTIONS_HEADING);
    expect(model.heading.toLowerCase()).toContain("connection");
    expect(model.whyTwo).toBe(CONNECTION_STATUS_CLOUD_CONNECTIONS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("integration");
    expect(model.whyTwo.toLowerCase()).toContain("cloud");
    expect(model.whyTwo.toLowerCase()).toContain("architecture evidence");
    expect(model.compactLine).toBe(CONNECTION_STATUS_CLOUD_CONNECTIONS_COMPACT_LINE);

    expect(model.connectionStatusLink).toEqual(CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK);
    expect(model.connectionStatusLink.href).toBe(ADMINISTRATION_CONNECTION_STATUS_PATH);
    expect(model.connectionStatusLink.href).toBe("/administration/connection-status");

    expect(model.cloudConnectionsLink).toEqual(CONNECTION_STATUS_CLOUD_CONNECTIONS_CLOUD_LINK);
    expect(model.cloudConnectionsLink.href).toBe(CLOUD_CONNECTIONS_PATH);
    expect(model.cloudConnectionsLink.href).toBe("/integrations/cloud-connections");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveConnectionStatusCloudConnectionsPeerLink("connection-status")).toEqual(
      CONNECTION_STATUS_CLOUD_CONNECTIONS_CLOUD_LINK,
    );
    expect(resolveConnectionStatusCloudConnectionsPeerLink("cloud-connections")).toEqual(
      CONNECTION_STATUS_CLOUD_CONNECTIONS_STATUS_LINK,
    );
  });
});
