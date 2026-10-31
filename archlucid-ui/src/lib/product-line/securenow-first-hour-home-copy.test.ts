import { describe, expect, it } from "vitest";

import {
  SECURENOW_FIRST_HOUR_HOME_ROWS,
  SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING,
  SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD,
  SECURENOW_FIRST_HOUR_OPERATOR_PATH,
} from "@/lib/product-line/securenow-first-hour-home-copy";

describe("SecureNow first hour home copy", () => {
  it("defines the Start here section with one recommended row", () => {
    expect(SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING).toBe("Start here");
    expect(SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD).toMatch(/NO_GO/);
    expect(SECURENOW_FIRST_HOUR_HOME_ROWS).toHaveLength(1);
    expect(SECURENOW_FIRST_HOUR_HOME_ROWS[0]?.href).toBe(SECURENOW_FIRST_HOUR_OPERATOR_PATH);
    expect(SECURENOW_FIRST_HOUR_HOME_ROWS[0]?.recommendedFirst).toBe(true);
  });

  it("does not make timed SLA or autonomous remediation claims", () => {
    const copy = [
      SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING,
      SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD,
      ...SECURENOW_FIRST_HOUR_HOME_ROWS.flatMap((row) => [row.label, row.summary]),
    ].join(" ");

    expect(copy).not.toMatch(/\$/);
    expect(copy).not.toMatch(/minutes to value/i);
    expect(copy).not.toMatch(/hands-free/i);
  });
});
