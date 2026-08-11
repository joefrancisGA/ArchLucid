import { describe, expect, it } from "vitest";

import {
  mapSecurityTrustPostureStatusToTagKind,
  resolveSecurityTrustPostureStatusTagLabel,
} from "@/lib/security-trust-help-presentation";

describe("security-trust-help-presentation", () => {
  it("maps posture summary status labels to short tag labels", () => {
    expect(resolveSecurityTrustPostureStatusTagLabel("Self-asserted")).toBe("Self-asserted");
    expect(resolveSecurityTrustPostureStatusTagLabel("Planned, not yet scheduled — no vendor committed")).toBe(
      "Planned",
    );
    expect(resolveSecurityTrustPostureStatusTagLabel("Active control")).toBe("Active");
    expect(resolveSecurityTrustPostureStatusTagLabel("Not issued — interim self-assessment only")).toBe("Not issued");
  });

  it("maps posture summary status labels to StatusTag kinds", () => {
    expect(mapSecurityTrustPostureStatusToTagKind("Self-asserted")).toBe("neutral");
    expect(mapSecurityTrustPostureStatusToTagKind("Planned, not yet scheduled")).toBe("in-progress");
    expect(mapSecurityTrustPostureStatusToTagKind("Active control")).toBe("in-progress");
    expect(mapSecurityTrustPostureStatusToTagKind("Not issued — interim self-assessment only")).toBe(
      "needs-attention",
    );
  });
});
