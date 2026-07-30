import { describe, expect, it } from "vitest";

import {
  adminRoiBulletinPreviewHref,
  illustrativeQuarterLabelFromSample,
} from "./example-roi-bulletin-honesty";

describe("example-roi-bulletin-honesty (TB-1520)", () => {
  it("reads the illustrative quarter from the sample Markdown", () => {
    const markdown = "# Sample\n\n**Quarter:** Q2-2027 (illustrative label only)\n";

    expect(illustrativeQuarterLabelFromSample(markdown)).toBe("Q2-2027");
  });

  it("builds the operator-only admin preview href with minTenants=5", () => {
    expect(adminRoiBulletinPreviewHref("Q1-2026")).toBe(
      "/api/proxy/v1/admin/roi-bulletin-preview?quarter=Q1-2026&minTenants=5",
    );
  });
});
