import { describe, expect, it } from "vitest";

import { inAppHelpHref } from "@/lib/product-documentation-registry";
import {
  OPERATOR_HOME_ORIENTATION_SOURCES,
  OPERATOR_HOME_SOURCES,
} from "@/lib/operator/operator-home-evidence-copy";

describe("operator-home-evidence-copy", () => {
  it("excludes review CTAs and contextual-help topic from orientation Sources when the page surfaces those paths", () => {
    expect(OPERATOR_HOME_SOURCES.some((source) => source.href === "/architecture/reviews/new")).toBe(true);
    expect(OPERATOR_HOME_SOURCES.some((source) => source.href === "/architecture/reviews")).toBe(true);
    expect(
      OPERATOR_HOME_SOURCES.some((source) => source.href === inAppHelpHref("first-architecture-review")),
    ).toBe(true);
    expect(OPERATOR_HOME_ORIENTATION_SOURCES.some((source) => source.href === "/architecture/reviews/new")).toBe(
      false,
    );
    expect(OPERATOR_HOME_ORIENTATION_SOURCES.some((source) => source.href === "/architecture/reviews")).toBe(false);
    expect(
      OPERATOR_HOME_ORIENTATION_SOURCES.some((source) => source.href === inAppHelpHref("first-architecture-review")),
    ).toBe(false);
  });
});
