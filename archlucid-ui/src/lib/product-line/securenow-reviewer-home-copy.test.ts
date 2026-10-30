import { describe, expect, it } from "vitest";

import {
  SECURENOW_REVIEWER_HOME_ROWS,
  SECURENOW_REVIEWER_HOME_SECTION_HEADING,
  SECURENOW_REVIEWER_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-reviewer-home-copy";

describe("SecureNow reviewer home copy (SN-MKT-06)", () => {
  it("defines the For reviewers section and three destinations", () => {
    expect(SECURENOW_REVIEWER_HOME_SECTION_HEADING).toBe("For reviewers");
    expect(SECURENOW_REVIEWER_HOME_SECTION_LEAD).toMatch(/NO_GO/);

    const labels = SECURENOW_REVIEWER_HOME_ROWS.map((row) => row.label);
    expect(labels).toEqual(["Draft overview", "Reviewer packet", "Request a conversation"]);
    expect(SECURENOW_REVIEWER_HOME_ROWS.filter((row) => row.recommendedFirst === true)).toHaveLength(0);
  });

  it("avoids buy CTAs and dollar amounts in copy", () => {
    const joined = [
      SECURENOW_REVIEWER_HOME_SECTION_HEADING,
      SECURENOW_REVIEWER_HOME_SECTION_LEAD,
      ...SECURENOW_REVIEWER_HOME_ROWS.flatMap((row) => [row.label, row.summary]),
    ].join(" ");

    expect(joined).not.toMatch(/\$/);
    expect(joined).not.toMatch(/Start trial/i);
    expect(joined).not.toMatch(/\bBuy\b/);
  });
});
