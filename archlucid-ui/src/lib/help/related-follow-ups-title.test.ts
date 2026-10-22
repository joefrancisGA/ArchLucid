import { describe, expect, it } from "vitest";

import { inAppHelpHref } from "@/lib/product-documentation-registry";

import {
  RELATED_GUIDES_FOLLOW_UPS_TITLE,
  RELATED_RESOURCES_FOLLOW_UPS_TITLE,
  isHelpOnlyRelatedFollowUpsTitle,
  resolveRelatedFollowUpsTitle,
} from "@/lib/help/related-follow-ups-title";

describe("related-follow-ups-title", () => {
  it("uses Related Guides for help-only link lists", () => {
    expect(
      resolveRelatedFollowUpsTitle([
        { href: inAppHelpHref("cloud-connections") },
        { href: inAppHelpHref("getting-started") },
      ]),
    ).toBe(RELATED_GUIDES_FOLLOW_UPS_TITLE);
  });

  it("uses Related Resources when help and operator routes are mixed", () => {
    expect(
      resolveRelatedFollowUpsTitle([
        { href: "/administration/connection-status" },
        { href: inAppHelpHref("cloud-connections") },
      ]),
    ).toBe(RELATED_RESOURCES_FOLLOW_UPS_TITLE);
  });

  it("identifies help-only strip titles for prefix suppression", () => {
    expect(isHelpOnlyRelatedFollowUpsTitle(RELATED_GUIDES_FOLLOW_UPS_TITLE)).toBe(true);
    expect(isHelpOnlyRelatedFollowUpsTitle(RELATED_RESOURCES_FOLLOW_UPS_TITLE)).toBe(false);
  });
});
