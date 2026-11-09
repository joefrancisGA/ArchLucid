import { describe, expect, it } from "vitest";

import {
  SECURENOW_REVIEWER_HOME_ROWS,
  SECURENOW_REVIEWER_HOME_SECTION_HEADING,
  SECURENOW_REVIEWER_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-reviewer-home-copy";
import { WHY_SECURENOW_CONVERSATION_MAILTO } from "@/lib/marketing/why-securenow-draft-copy";

describe("SecureNow reviewer home copy (SN-MKT-06 / SN-MKT-10)", () => {
  it("defines the For reviewers section and public destinations", () => {
    expect(SECURENOW_REVIEWER_HOME_SECTION_HEADING).toBe("For reviewers");
    expect(SECURENOW_REVIEWER_HOME_SECTION_LEAD).toMatch(/Public explanation/i);
    expect(SECURENOW_REVIEWER_HOME_SECTION_LEAD).toMatch(/NO_GO/);

    const labels = SECURENOW_REVIEWER_HOME_ROWS.map((row) => row.label);
    expect(labels).toEqual([
      "Why SecureNow",
      "SecureNow sample",
      "Reviewer packet",
      "Public reviewer ask",
      "Quote packet",
      "Request a conversation",
      "Accessibility",
    ]);
    expect(
      SECURENOW_REVIEWER_HOME_ROWS.find((row) => row.label === "Request a conversation")?.href,
    ).toBe(WHY_SECURENOW_CONVERSATION_MAILTO);
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
