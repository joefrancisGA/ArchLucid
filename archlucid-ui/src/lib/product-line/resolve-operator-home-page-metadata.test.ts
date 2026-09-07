import { describe, expect, it } from "vitest";

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SECURITY_PRODUCT_HOME_TITLE } from "@/lib/product-line/product-line-copy";
import { resolveOperatorHomePageMetadataTitle } from "@/lib/product-line/resolve-operator-home-page-metadata";

describe("resolveOperatorHomePageMetadataTitle", () => {
  it("uses the Security home title for the security product line", () => {
    expect(resolveOperatorHomePageMetadataTitle("security")).toBe(SECURITY_PRODUCT_HOME_TITLE);
  });

  it("uses the operator home label for the architecture product line", () => {
    expect(resolveOperatorHomePageMetadataTitle("architecture")).toBe(OPERATOR_NAV_LINK_LABELS.home);
  });
});
