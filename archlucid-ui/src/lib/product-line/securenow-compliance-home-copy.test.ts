import { describe, expect, it } from "vitest";

import { SECURENOW_COMPLIANCE_HOME_ROWS } from "./securenow-compliance-home-copy";

describe("SecureNow compliance Home copy", () => {
  it("adds a duty-split destination without changing the recommended row", () => {
    expect(SECURENOW_COMPLIANCE_HOME_ROWS).toHaveLength(4);
    expect(SECURENOW_COMPLIANCE_HOME_ROWS.filter((row) => row.recommendedFirst === true)).toHaveLength(1);
    expect(SECURENOW_COMPLIANCE_HOME_ROWS[3]).toMatchObject({
      href: "/administration/securenow-compliance-notes",
      label: "Duty split",
    });
  });
});
