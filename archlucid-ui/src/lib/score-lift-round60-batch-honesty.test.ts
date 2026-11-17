import { describe, expect, it } from "vitest";

import {
  SECURENOW_COLLECTION_READY_PARTIAL_CAPTURE_LINE,
  SECURENOW_PARTIAL_CAPTURE_RANKED_PATHS_LINE,
} from "@/lib/product-line/securenow-partial-capture-honesty-copy";
import { REMEDIATION_FACTORY_SIMULATOR_NOT_INVENTORY_CAPTURE_LINE } from "@/lib/remediation-factory-simulator-rank-honesty-copy";
import { formatCloudConnectionsReturnLinkLabel } from "@/lib/integrations/cloud-connections-return-path-honesty-copy";

describe("score-lift round60 batch honesty", () => {
  it("collection ready partial, simulator, and return labels", () => {
    expect(SECURENOW_COLLECTION_READY_PARTIAL_CAPTURE_LINE).toContain("marked ready");
    expect(REMEDIATION_FACTORY_SIMULATOR_NOT_INVENTORY_CAPTURE_LINE).toContain("re-rank");
    expect(formatCloudConnectionsReturnLinkLabel("/help/connection-status")).toContain("connection status");
    expect(SECURENOW_PARTIAL_CAPTURE_RANKED_PATHS_LINE).toContain("gaps");
  });
});