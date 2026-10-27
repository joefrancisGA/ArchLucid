import { describe, expect, it } from "vitest";

import { buildFirstPilotPayload } from "./first-pilot-intake-payload";

describe("buildFirstPilotPayload", () => {
  it("does not send staging or None as chosen environment and cloud provider", () => {
    const payload = buildFirstPilotPayload("Acme payments", "Brief body", ["cost"], false);

    expect(payload).not.toHaveProperty("environment");
    expect(payload).not.toHaveProperty("cloudProvider");
  });
});
