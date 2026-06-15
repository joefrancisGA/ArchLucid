import { describe, expect, it } from "vitest";

import {
  OPERATOR_HOME_EXAMPLE_DESCRIPTION,
  OPERATOR_HOME_EXAMPLE_QUERY_VALUE,
  OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN,
  OPERATOR_HOME_EXAMPLE_SYSTEM_NAME,
} from "./operator-home-example-request";

describe("operator-home-example-request", () => {
  it("uses buyer-safe example copy with no GitHub references", () => {
    const surfaces = [
      OPERATOR_HOME_EXAMPLE_QUERY_VALUE,
      OPERATOR_HOME_EXAMPLE_DESCRIPTION,
      OPERATOR_HOME_EXAMPLE_SYSTEM_NAME,
      OPERATOR_HOME_EXAMPLE_RUN_DESCRIPTION_TOKEN,
    ];

    for (const text of surfaces) {
      expect(text.toLowerCase()).not.toContain("github");
    }
  });
});
