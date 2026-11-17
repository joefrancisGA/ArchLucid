import { describe, expect, it } from "vitest";

import {
  SECURENOW_RETURN_HOME_ROWS,
  SECURENOW_RETURN_HOME_SECTION_HEADING,
  SECURENOW_RETURN_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-return-home-copy";

describe("SecureNow return home copy", () => {
  it("defines the four existing return destinations", () => {
    expect(SECURENOW_RETURN_HOME_SECTION_HEADING).toBe("Come back for");
    expect(SECURENOW_RETURN_HOME_SECTION_LEAD).toMatch(/NO_GO/);
    expect(SECURENOW_RETURN_HOME_ROWS.map((row) => row.href)).toEqual([
      "/security/remediation-instances",
      "/infrastructure/snapshots-drift",
      "/infrastructure/diagrams",
      "/administration/securenow-pilot-decision",
    ]);
    expect(SECURENOW_RETURN_HOME_ROWS.filter((row) => row.recommendedFirst === true)).toHaveLength(0);
  });

  it("does not make usage or commercial claims", () => {
    const copy = [
      SECURENOW_RETURN_HOME_SECTION_HEADING,
      SECURENOW_RETURN_HOME_SECTION_LEAD,
      ...SECURENOW_RETURN_HOME_ROWS.flatMap((row) => [row.label, row.summary]),
    ].join(" ");

    expect(copy).not.toMatch(/\$/);
    expect(copy).not.toMatch(/engagement score/i);
    expect(copy).not.toMatch(/guaranteed return/i);
  });
});
