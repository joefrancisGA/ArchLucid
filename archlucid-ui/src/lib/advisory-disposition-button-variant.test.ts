import { describe, expect, it } from "vitest";

import { advisoryDispositionButtonVariant } from "@/lib/advisory-disposition-button-variant";

describe("advisoryDispositionButtonVariant (TB-1127)", () => {
  it("makes Accept the primary action chrome", () => {
    expect(advisoryDispositionButtonVariant("Accept")).toBe("primary");
  });

  it("uses solid secondary chrome for non-accept dispositions", () => {
    expect(advisoryDispositionButtonVariant("Defer")).toBe("secondary");
    expect(advisoryDispositionButtonVariant("Reject")).toBe("secondary");
    expect(advisoryDispositionButtonVariant("MarkImplemented")).toBe("secondary");
  });
});
