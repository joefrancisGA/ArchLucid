import { describe, expect, it } from "vitest";

import {
  SECURENOW_FIRST_HOUR_HOME_ROWS,
  SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING,
  SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-first-hour-home-copy";
import { SECURENOW_FIRST_HOUR_HOME_ROW_HREFS_WITHOUT_SNAPSHOT } from "@/lib/product-line/build-securenow-first-hour-home-rows";

describe("SecureNow first hour home copy", () => {
  it("defines the Start here section with five unique static rows", () => {
    expect(SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING).toBe("Start here");
    expect(SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD).toBe(
      "A missing or stale capture is the current step. A blank ranking is not a clean result. This is not a timed SLA. SecureNow beta remains NO_GO.",
    );
    expect(SECURENOW_FIRST_HOUR_HOME_ROWS).toHaveLength(5);
    expect(new Set(SECURENOW_FIRST_HOUR_HOME_ROWS.map((row) => row.href)).size).toBe(5);
    expect(SECURENOW_FIRST_HOUR_HOME_ROWS.map((row) => row.href)).toEqual(
      SECURENOW_FIRST_HOUR_HOME_ROW_HREFS_WITHOUT_SNAPSHOT,
    );
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
