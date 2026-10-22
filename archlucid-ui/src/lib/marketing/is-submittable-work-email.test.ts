import { describe, expect, it } from "vitest";

import { isSubmittableWorkEmail } from "@/lib/marketing/is-submittable-work-email";

describe("isSubmittableWorkEmail", () => {
  it("rejects empty, partial, and malformed addresses", () => {
    expect(isSubmittableWorkEmail(null)).toBe(false);
    expect(isSubmittableWorkEmail(undefined)).toBe(false);
    expect(isSubmittableWorkEmail("")).toBe(false);
    expect(isSubmittableWorkEmail("j")).toBe(false);
    expect(isSubmittableWorkEmail("cio@")).toBe(false);
    expect(isSubmittableWorkEmail("cio@contoso")).toBe(false);
  });

  it("accepts a well-formed address with surrounding whitespace", () => {
    expect(isSubmittableWorkEmail("cio@contoso.com")).toBe(true);
    expect(isSubmittableWorkEmail("  cio@contoso.com  ")).toBe(true);
  });
});
