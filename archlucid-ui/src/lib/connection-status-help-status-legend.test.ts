import { describe, expect, it } from "vitest";

import {
  ALL_CONNECTOR_DISPLAY_STATUSES,
  CONNECTION_STATUS_HELP_STATUS_LEGEND,
} from "@/lib/connection-status-help-status-legend";
import type { ConnectorDisplayStatus } from "@/lib/connector-operations-present";
import { resolveConnectorDisplayStatusTag } from "@/lib/connector-operations-present";

const EXPECTED_STATUSES: readonly ConnectorDisplayStatus[] = [
  "Ready",
  "Recommended",
  "Optional",
  "Not configured",
  "Disabled",
  "Needs attention",
];

describe("connection-status-help-status-legend", () => {
  it("covers every ConnectorDisplayStatus exactly once", () => {
    expect(CONNECTION_STATUS_HELP_STATUS_LEGEND).toHaveLength(EXPECTED_STATUSES.length);
    expect(ALL_CONNECTOR_DISPLAY_STATUSES).toEqual(EXPECTED_STATUSES);

    for (const status of EXPECTED_STATUSES) {
      const row = CONNECTION_STATUS_HELP_STATUS_LEGEND.find((entry) => entry.status === status);
      expect(row).toBeDefined();
      expect(resolveConnectorDisplayStatusTag(status).label).toBeTruthy();
    }
  });

  it("assigns a distinct status kind to every connector display status", () => {
    const kinds = EXPECTED_STATUSES.map((status) => resolveConnectorDisplayStatusTag(status).kind);

    expect(new Set(kinds).size).toBe(EXPECTED_STATUSES.length);
    expect(resolveConnectorDisplayStatusTag("Recommended").kind).not.toBe(
      resolveConnectorDisplayStatusTag("Needs attention").kind,
    );
    expect(resolveConnectorDisplayStatusTag("Needs attention").label).toBe("Needs attention");
  });
});
