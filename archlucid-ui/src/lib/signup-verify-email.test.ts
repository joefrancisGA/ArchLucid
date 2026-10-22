import { describe, expect, it } from "vitest";

import { maskEmailForDisplay } from "@/lib/signup-verify-email";

describe("maskEmailForDisplay", () => {
  it("masks the local part while keeping the domain visible", () => {
    expect(maskEmailForDisplay("ops@example.com")).toBe("o***@example.com");
  });

  it("keeps a single-character local part visible", () => {
    expect(maskEmailForDisplay("a@example.com")).toBe("a@example.com");
  });

  it("returns empty for invalid input", () => {
    expect(maskEmailForDisplay("not-an-email")).toBe("");
    expect(maskEmailForDisplay("")).toBe("");
  });
});
