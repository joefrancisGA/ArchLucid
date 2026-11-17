import { describe, expect, it } from "vitest";

import { REMEDIATION_WAVES_EMPTY_LABEL } from "@/lib/remediation-wave-list-copy";

import { SECURENOW_REMEDIATION_WAVES_EMPTY_LABEL } from "./securenow-remediation-waves-empty-copy";

describe("SecureNow remediation waves empty copy", () => {
  it("keeps the SecureNow next action separate from the shared architecture copy", () => {
    expect(SECURENOW_REMEDIATION_WAVES_EMPTY_LABEL).toBe(
      "No remediation waves yet. Open Priorities & waves and select a ranked path. A blank list is not a clean result.",
    );
    expect(REMEDIATION_WAVES_EMPTY_LABEL).toBe("No remediation waves yet.");
  });
});
