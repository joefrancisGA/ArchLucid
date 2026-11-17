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
    expect(SECURENOW_SPONSOR_HOME_ROWS).toHaveLength(7);
    expect(new Set(SECURENOW_SPONSOR_HOME_ROWS.map((row) => row.href)).size).toBe(7);
    expect(SECURENOW_SPONSOR_HOME_ROWS[0]?.href).toBe("/why-securenow#reviewer-pack");
    expect(SECURENOW_SPONSOR_HOME_ROWS[1]?.href).not.toMatch(/^https:\/\/github\.com\//i);
    expect(SECURENOW_SPONSOR_HOME_ROWS[1]?.href).not.toBe("/help");
    expect(SECURENOW_SPONSOR_HOME_ROWS[1]?.href).toBe(
      "/administration/securenow-sponsor-path#executive-packet-fill-guide",
    );
    expect(SECURENOW_SPONSOR_HOME_ROWS[1]?.summary).toBe(
      "Map each packet field to an evidence owner. Leave customer outcomes blank.",
    );
    expect(SECURENOW_SPONSOR_HOME_ROWS[2]?.href).toBe("/administration/securenow-pilot-decision");
    expect(SECURENOW_SPONSOR_HOME_ROWS[3]?.href).toBe(
      "/administration/securenow-pilot-decision#decision-cycle",
    );
    expect(SECURENOW_SPONSOR_HOME_ROWS[4]?.href).toBe(
      "/administration/securenow-investigation-effort",
    );
    expect(SECURENOW_SPONSOR_HOME_ROWS[3]?.summary).toBe(
      "Open the blank qualify-to-close log. Do not write a duration.",
    );
    expect(SECURENOW_SPONSOR_HOME_ROWS[5]?.href).not.toMatch(/^https:\/\/github\.com\//i);
    expect(SECURENOW_SPONSOR_HOME_ROWS[5]?.href).not.toBe("/help");
    expect(SECURENOW_SPONSOR_HOME_ROWS[5]?.href).toBe(
      "/administration/securenow-sponsor-path#sponsor-readout-outline",
    );
    expect(SECURENOW_SPONSOR_HOME_ROWS[5]?.summary).toBe(
      "Stage 6 facilitation. Not an approved offer and not customer evidence.",
    );
    expect(SECURENOW_SPONSOR_HOME_ROWS[6]?.href).toBe("/trust#self-assessment");
    expect(SECURENOW_SPONSOR_HOME_ROWS[6]?.summary).toMatch(/Not CPA attestation/);
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
    expect(copy).not.toMatch(/\d+\s*(minute|hour|day)/i);
  });
});
