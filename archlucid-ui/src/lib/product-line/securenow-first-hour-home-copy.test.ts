import { describe, expect, it } from "vitest";

import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import {
  SECURENOW_FIRST_HOUR_HOME_ROWS,
  SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING,
  SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD,
  SECURENOW_FIRST_HOUR_OPERATOR_PATH,
} from "@/lib/product-line/securenow-first-hour-home-copy";

describe("SecureNow first hour home copy", () => {
  it("defines the Start here section with five unique rows and one recommendation", () => {
    expect(SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING).toBe("Start here");
    expect(SECURENOW_FIRST_HOUR_HOME_SECTION_LEAD).toBe(
      "A missing or stale capture is the current step. A blank ranking is not a clean result. This is not a timed SLA. SecureNow beta remains NO_GO.",
    );
    expect(SECURENOW_FIRST_HOUR_HOME_ROWS).toHaveLength(5);
    expect(new Set(SECURENOW_FIRST_HOUR_HOME_ROWS.map((row) => row.href)).size).toBe(5);
    expect(SECURENOW_FIRST_HOUR_HOME_ROWS.map((row) => row.href)).toEqual([
      CLOUD_CONNECTIONS_PATH,
      SECURENOW_REMEDIATION_FACTORY_PATH,
      `${SECURENOW_FIRST_HOUR_OPERATOR_PATH}#path-inspect`,
      `${SECURENOW_FIRST_HOUR_OPERATOR_PATH}#stop`,
      SECURENOW_FIRST_HOUR_OPERATOR_PATH,
    ]);
    expect(SECURENOW_FIRST_HOUR_HOME_ROWS[0]?.recommendedFirst).toBe(true);
    expect(SECURENOW_FIRST_HOUR_HOME_ROWS.slice(1).every((row) => !row.recommendedFirst)).toBe(true);
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
