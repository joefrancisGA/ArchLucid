import { describe, expect, it } from "vitest";

import {
  SECURENOW_SPONSOR_HOME_ROWS,
  SECURENOW_SPONSOR_HOME_SECTION_HEADING,
  SECURENOW_SPONSOR_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-sponsor-home-copy";

describe("SecureNow sponsor home copy", () => {
  it("defines internal sponsor readout destinations", () => {
    expect(SECURENOW_SPONSOR_HOME_SECTION_HEADING).toBe("For sponsors");
    expect(SECURENOW_SPONSOR_HOME_SECTION_LEAD).toMatch(/NO_GO/);
    expect(SECURENOW_SPONSOR_HOME_ROWS).toHaveLength(3);
    expect(SECURENOW_SPONSOR_HOME_ROWS[0]?.href).toBe("/why-securenow#reviewer-pack");
    expect(SECURENOW_SPONSOR_HOME_ROWS[1]?.href).toBe("/why-securenow");
    expect(SECURENOW_SPONSOR_HOME_ROWS[2]?.href).toBe("/administration/securenow-pilot-decision");
  });

  it("does not introduce commercial claims", () => {
    const copy = [
      SECURENOW_SPONSOR_HOME_SECTION_HEADING,
      SECURENOW_SPONSOR_HOME_SECTION_LEAD,
      ...SECURENOW_SPONSOR_HOME_ROWS.flatMap((row) => [row.label, row.summary]),
    ].join(" ");

    expect(copy).not.toMatch(/\$/);
    expect(copy).not.toMatch(/guaranteed savings/i);
    expect(copy).not.toMatch(/start trial/i);
  });
});
