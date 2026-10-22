import { describe, expect, it } from "vitest";

import { GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE } from "@/lib/governance/governance-infrastructure-copy";
import { SECURENOW_INFRASTRUCTURE_RESOURCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { resolveSecureNowPageHeading } from "@/lib/product-line/securenow-page-heading";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";
import { secureNowTitleCase } from "@/lib/product-line/securenow-title-case";

describe("resolveSecureNowPageHeading", () => {
  it("uses the SecureNow nav label when the product line is security and the href is mapped", () => {
    expect(
      resolveSecureNowPageHeading(
        "security",
        GOVERNANCE_INFRASTRUCTURE_RESOURCES_PAGE_TITLE,
        SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
      ),
    ).toBe(SECURENOW_NAV_LABELS[SECURENOW_INFRASTRUCTURE_RESOURCES_PATH]);
  });

  it("title-cases the architecture heading when the nav href is unknown on the security shell", () => {
    const architectureHeading = "resource explorer";

    expect(resolveSecureNowPageHeading("security", architectureHeading, "/unknown/route")).toBe(
      secureNowTitleCase(architectureHeading),
    );
  });

  it("returns the architecture heading unchanged on the architecture product line", () => {
    const architectureHeading = "Resource explorer";

    expect(
      resolveSecureNowPageHeading(
        "architecture",
        architectureHeading,
        SECURENOW_INFRASTRUCTURE_RESOURCES_PATH,
      ),
    ).toBe(architectureHeading);
  });
});
