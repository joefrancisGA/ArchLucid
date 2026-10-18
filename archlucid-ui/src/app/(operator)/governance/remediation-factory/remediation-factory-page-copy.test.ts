import { describe, expect, it } from "vitest";

import { REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID } from "./remediation-factory-page-copy";

describe("remediation factory page copy", () => {
  it("exports a stable path inspect panel id", () => {
    expect(REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID).toBe("remediation-factory-path-inspect");
  });
});
