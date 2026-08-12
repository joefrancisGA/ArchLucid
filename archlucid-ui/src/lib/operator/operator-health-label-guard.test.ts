import { describe, expect, it } from "vitest";

import {
  DATA_ARCHIVAL_HEALTH_LABELS,
  POST_COMMIT_INTEGRATION_LINK_TITLES,
  SERVICE_BUS_HEALTH_LABELS,
  WORKSPACE_SETUP_HEALTH_LABELS,
} from "@/lib/operator/operator-health-labels";
import {
  OPERATOR_HEALTH_LABEL_BANNED_PATTERNS,
  OPERATOR_HEALTH_LABEL_EXPORTS,
} from "@/lib/operator/operator-health-label-surfaces";

const OPERATOR_HEALTH_LABEL_OBJECTS: ReadonlyArray<Record<string, string>> = [
  SERVICE_BUS_HEALTH_LABELS,
  DATA_ARCHIVAL_HEALTH_LABELS,
  WORKSPACE_SETUP_HEALTH_LABELS,
  POST_COMMIT_INTEGRATION_LINK_TITLES,
];

describe("operator health label guard (TB-650)", () => {
  it("tracks all operator health label exports", () => {
    expect(OPERATOR_HEALTH_LABEL_EXPORTS).toEqual([
      "SERVICE_BUS_HEALTH_LABELS",
      "DATA_ARCHIVAL_HEALTH_LABELS",
      "WORKSPACE_SETUP_HEALTH_LABELS",
      "POST_COMMIT_INTEGRATION_LINK_TITLES",
    ]);
  });

  it("keeps operator health label constants free of Azure infra jargon", () => {
    for (const labels of OPERATOR_HEALTH_LABEL_OBJECTS) {
      const text = JSON.stringify(labels).toLowerCase();

      for (const pattern of OPERATOR_HEALTH_LABEL_BANNED_PATTERNS) {
        expect(text, `health labels should not contain "${pattern}"`).not.toContain(pattern);
      }
    }
  });
});
