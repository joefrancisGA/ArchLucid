import { describe, expect, it } from "vitest";

import {
  filterWhereToGoNextFollowUpLinks,
  isAdminOrInternalFollowUpHref,
  isExcludedFromWhereToGoNextFollowUps,
  isWhereToGoNextFollowUpsTitle,
} from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

describe("where-to-go-next-follow-up-links", () => {
  it("recognizes the canonical Where to go next title", () => {
    expect(isWhereToGoNextFollowUpsTitle("Where to go next")).toBe(true);
    expect(isWhereToGoNextFollowUpsTitle("Related guides")).toBe(false);
  });

  it("flags administration and internal product routes", () => {
    expect(isAdminOrInternalFollowUpHref("/administration/users")).toBe(true);
    expect(isAdminOrInternalFollowUpHref("/administration/users?tab=roles")).toBe(true);
    expect(isAdminOrInternalFollowUpHref("/internal/health")).toBe(true);
    expect(isAdminOrInternalFollowUpHref("/admin/ai-usage-cost")).toBe(true);
    expect(isAdminOrInternalFollowUpHref("/architecture/reviews")).toBe(false);
    expect(isAdminOrInternalFollowUpHref(inAppHelpHref("getting-started"))).toBe(false);
  });

  it("excludes adminOnly and administration/internal hrefs from Where to go next lists", () => {
    const links = [
      { label: "Getting started", href: inAppHelpHref("getting-started") },
      { label: "Users and roles", href: "/administration/users", adminOnly: true },
      { label: "System health", href: "/administration/system-health" },
      { label: "Preferences", href: "/account/preferences" },
    ];

    expect(filterWhereToGoNextFollowUpLinks(links)).toEqual([
      { label: "Getting started", href: inAppHelpHref("getting-started") },
      { label: "Preferences", href: "/account/preferences" },
    ]);

    expect(
      isExcludedFromWhereToGoNextFollowUps({
        label: "Product learning",
        href: "/internal/product-learning",
      }),
    ).toBe(true);
  });
});
