import { describe, expect, it } from "vitest";

import {
  SECURENOW_SCENARIO_HOME_ROWS,
  SECURENOW_SCENARIO_HOME_SECTION_HEADING,
  SECURENOW_SCENARIO_HOME_SECTION_LEAD,
} from "./securenow-scenario-home-copy";

describe("SecureNow scenario home copy", () => {
  it("offers six fixture walks without customer claims", () => {
    expect(SECURENOW_SCENARIO_HOME_SECTION_HEADING).toBe("Fixture walks");
    expect(SECURENOW_SCENARIO_HOME_SECTION_LEAD).toMatch(/NO_GO/);
    expect(SECURENOW_SCENARIO_HOME_ROWS).toHaveLength(6);
    expect(SECURENOW_SCENARIO_HOME_ROWS[0]?.href).toBe(
      "/security/remediation-factory?pathId=fixture-path-01",
    );

    const fixturePath02 = SECURENOW_SCENARIO_HOME_ROWS.find((row) => row.label.includes("fixture-path-02") || row.href.includes("fixture-path-02"));
    expect(fixturePath02?.href).toBe("/security/remediation-factory?pathId=fixture-path-02");
    expect(fixturePath02?.recommendedFirst).toBe(true);
    expect(fixturePath02?.summary).toMatch(/Path inspect/i);

    const copy = [
      SECURENOW_SCENARIO_HOME_SECTION_HEADING,
      SECURENOW_SCENARIO_HOME_SECTION_LEAD,
      ...SECURENOW_SCENARIO_HOME_ROWS.flatMap((row) => [row.label, row.summary]),
    ].join(" ");

    expect(copy).not.toMatch(/\$/);
    expect(copy).toMatch(/customer outcome/);
    expect(copy.match(/Synthetic fixture/g)).toHaveLength(6);
  });
});
