import { describe, expect, it } from "vitest";

import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { HUB_SECONDARY_FOLLOW_UPS_TITLES } from "@/lib/evidence-orientation/hub-secondary-follow-ups";
import {
  OPERATOR_HOME_FOLLOW_UPS_TITLE,
  OPERATOR_HOME_ORIENTATION_SOURCES,
  OPERATOR_HOME_SOURCES,
  OPERATOR_HOME_SOURCES_INTRO,
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

  it("labels orientation follow-ups as after-a-review work instead of the Home next step", () => {
    expect(OPERATOR_HOME_FOLLOW_UPS_TITLE).toBe(HUB_SECONDARY_FOLLOW_UPS_TITLES.operatorHome);
    expect(OPERATOR_HOME_SOURCES_INTRO.toLowerCase()).toContain("sponsor");
    expect(OPERATOR_HOME_SOURCES_INTRO.toLowerCase()).toContain("findings");
    expect(OPERATOR_HOME_SOURCES_INTRO.toLowerCase()).not.toContain("where to go next");
    expect(OPERATOR_HOME_SOURCES_INTRO.toLowerCase()).toContain("cards above");
  });
});
