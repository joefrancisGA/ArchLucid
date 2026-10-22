import { describe, expect, it } from "vitest";

import {
  BRANDED_NOT_FOUND_GENERIC_TITLE,
  BRANDED_NOT_FOUND_REVIEW_TITLE,
  brandedNotFoundBody,
  brandedNotFoundTitle,
} from "@/lib/operator/operator-branded-not-found-copy";

describe("operator-branded-not-found-copy", () => {
  it("returns generic title and body by default variant", () => {
    expect(brandedNotFoundTitle("generic")).toBe(BRANDED_NOT_FOUND_GENERIC_TITLE);
    expect(brandedNotFoundBody("generic")).toContain("mistyped");
  });

  it("returns review-specific title and body", () => {
    expect(brandedNotFoundTitle("review")).toBe(BRANDED_NOT_FOUND_REVIEW_TITLE);
    expect(brandedNotFoundBody("review")).toContain("another workspace");
  });
});
