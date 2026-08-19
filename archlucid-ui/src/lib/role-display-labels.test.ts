import { describe, expect, it } from "vitest";

import { roleClaimCaption, roleDisplayLabel, roleDisplayLabelDiffersFromClaim } from "./role-display-labels";

describe("role-display-labels", () => {
  it("displays the Operator role as Architect and leaves other built-ins unchanged", () => {
    expect(roleDisplayLabel("Operator")).toBe("Architect");
    expect(roleDisplayLabel("Admin")).toBe("Admin");
    expect(roleDisplayLabel("Reader")).toBe("Reader");
    expect(roleDisplayLabel("Auditor")).toBe("Auditor");
  });

  it("passes custom and unknown role names through unchanged", () => {
    expect(roleDisplayLabel("Architect (custom)")).toBe("Architect (custom)");
    expect(roleDisplayLabel("Release manager")).toBe("Release manager");
  });

  it("returns an empty label for null or undefined role names", () => {
    expect(roleDisplayLabel(null)).toBe("");
    expect(roleDisplayLabel(undefined)).toBe("");
  });

  it("discloses the claim value only when it differs from the displayed label", () => {
    expect(roleClaimCaption("Operator")).toBe("Claim value: Operator");
    expect(roleClaimCaption("Admin")).toBeNull();
    expect(roleClaimCaption("Release manager")).toBeNull();
    expect(roleClaimCaption(null)).toBeNull();
    expect(roleClaimCaption("")).toBeNull();
  });

  it("reports whether the label differs from the claim value", () => {
    expect(roleDisplayLabelDiffersFromClaim("Operator")).toBe(true);
    expect(roleDisplayLabelDiffersFromClaim("Reader")).toBe(false);
    expect(roleDisplayLabelDiffersFromClaim(undefined)).toBe(false);
  });
});
