import { describe, expect, it } from "vitest";

import {
  isNavLinkPinned,
  toggleNavPinnedLink,
  type NavPinnedLink,
} from "@/lib/usability/nav-pinned-links";

const GETTING_STARTED: NavPinnedLink = {
  href: "/help/getting-started#how-archlucid-works",
  label: "Getting started",
};

describe("nav pinned links", () => {
  it("treats the same page as pinned regardless of fragment or query string", () => {
    const pinned = toggleNavPinnedLink([], GETTING_STARTED);

    expect(isNavLinkPinned(pinned, "/help/getting-started")).toBe(true);
    expect(isNavLinkPinned(pinned, "/help/getting-started#first-review")).toBe(true);
    expect(isNavLinkPinned(pinned, "/help/getting-started?tab=basics")).toBe(true);
    expect(isNavLinkPinned(pinned, "/help/evidence-trail")).toBe(false);
  });

  it("unpins a page when toggled from a different anchor on that page", () => {
    const pinned = toggleNavPinnedLink([], GETTING_STARTED);
    const unpinned = toggleNavPinnedLink(pinned, {
      href: "/help/getting-started#first-review",
      label: "First review",
    });

    expect(unpinned).toEqual([]);
  });

  it("keeps distinct pages separate", () => {
    const pinned = toggleNavPinnedLink(
      toggleNavPinnedLink([], GETTING_STARTED),
      { href: "/governance/findings", label: "Findings" },
    );

    expect(pinned).toHaveLength(2);
    expect(isNavLinkPinned(pinned, "/governance/findings#queue")).toBe(true);
  });
});
