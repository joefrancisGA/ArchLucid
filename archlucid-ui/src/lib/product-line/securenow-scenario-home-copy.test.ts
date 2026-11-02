import { describe, expect, it } from "vitest";

import {
  SECURENOW_SCENARIO_HOME_ROWS,
  SECURENOW_SCENARIO_HOME_SECTION_HEADING,
  SECURENOW_SCENARIO_HOME_SECTION_LEAD,
} from "./securenow-scenario-home-copy";

describe("SecureNow scenario home copy", () => {
  it("links to the fixture walks page without customer claims", () => {
    expect(SECURENOW_SCENARIO_HOME_SECTION_HEADING).toBe("Fixture walks");
    expect(SECURENOW_SCENARIO_HOME_SECTION_LEAD).toMatch(/NO_GO/);
    expect(SECURENOW_SCENARIO_HOME_ROWS).toHaveLength(1);
    expect(SECURENOW_SCENARIO_HOME_ROWS[0]?.href).toBe(
      "/administration/securenow-scenario-walks",
    );

    const copy = [
      SECURENOW_SCENARIO_HOME_SECTION_HEADING,
      SECURENOW_SCENARIO_HOME_SECTION_LEAD,
      ...SECURENOW_SCENARIO_HOME_ROWS.flatMap((row) => [row.label, row.summary]),
    ].join(" ");

    expect(copy).not.toMatch(/\$/);
    expect(copy).toMatch(/customer outcome/);
  });
});
