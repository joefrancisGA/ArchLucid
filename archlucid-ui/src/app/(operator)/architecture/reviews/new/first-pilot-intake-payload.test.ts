import { describe, expect, it } from "vitest";

import {
  buildFirstPilotPayload,
  FIRST_PILOT_REQUIRED_CAPABILITIES_NOT_COLLECTED_COPY,
} from "./first-pilot-intake-payload";

describe("buildFirstPilotPayload", () => {
  it("does not send staging or None as chosen environment and cloud provider", () => {
    const payload = buildFirstPilotPayload("Acme payments", "Brief body", ["cost"], false);

    expect(payload).not.toHaveProperty("environment");
    expect(payload).not.toHaveProperty("cloudProvider");
  });

  it("exports required-capabilities-not-collected honesty copy", () => {
    expect(FIRST_PILOT_REQUIRED_CAPABILITIES_NOT_COLLECTED_COPY).toContain(
      "Required capabilities are not collected",
    );
  });
});
