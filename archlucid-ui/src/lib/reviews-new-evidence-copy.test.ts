import { describe, expect, it } from "vitest";

import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  REVIEWS_NEW_DETAILED_HREF,
  REVIEWS_NEW_GUIDED_INTAKE_HREF,
  REVIEWS_NEW_QUICK_REVIEW_HREF,
} from "@/lib/reviews-new-path-copy";
import {
  REVIEWS_NEW_ORIENTATION_SOURCES,
  REVIEWS_NEW_SOURCES,
} from "@/lib/reviews-new-evidence-copy";

describe("reviews-new-evidence-copy", () => {
  it("excludes path tabs and contextual-help topics from orientation Sources when the page surfaces those CTAs", () => {
    expect(REVIEWS_NEW_SOURCES.some((source) => source.href === "/architecture/reviews")).toBe(true);
    expect(REVIEWS_NEW_SOURCES.some((source) => source.href === inAppHelpHref("evidence-intake"))).toBe(true);
    expect(
      REVIEWS_NEW_ORIENTATION_SOURCES.some((source) => source.href === REVIEWS_NEW_DETAILED_HREF),
    ).toBe(false);
    expect(
      REVIEWS_NEW_ORIENTATION_SOURCES.some((source) => source.href === REVIEWS_NEW_GUIDED_INTAKE_HREF),
    ).toBe(false);
    expect(
      REVIEWS_NEW_ORIENTATION_SOURCES.some((source) => source.href === REVIEWS_NEW_QUICK_REVIEW_HREF),
    ).toBe(false);
    expect(
      REVIEWS_NEW_ORIENTATION_SOURCES.some((source) => source.href === inAppHelpHref("evidence-intake")),
    ).toBe(false);
  });
});
