import { describe, expect, it } from "vitest";

import { SHOWCASE_HOME_AHA_MOMENT, showcasePrimaryFindingHref } from "./showcase-home-aha-moment";
import { SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "./showcase-static-demo";

describe("showcase-home-aha-moment", () => {
  it("aligns primary finding id with showcase static demo", () => {
    expect(SHOWCASE_HOME_AHA_MOMENT.id).toBe(SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID);
  });

  it("builds primary finding deep link for sample run", () => {
    expect(showcasePrimaryFindingHref(SHOWCASE_STATIC_DEMO_RUN_ID)).toBe(
      `/architecture/reviews/${SHOWCASE_STATIC_DEMO_RUN_ID}/findings/${SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID}`,
    );
  });
});
