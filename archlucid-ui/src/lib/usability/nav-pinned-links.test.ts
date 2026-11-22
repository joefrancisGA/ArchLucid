import { describe, expect, it } from "vitest";

import {
  isNavLinkPinned,
  readNavPinnedLinks,
  toggleNavPinnedLink,
  writeNavPinnedLinks,
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
  it("round-trips a legitimate local pinned route with query and anchor", () => {
    const link = { href: "/help/getting-started?tab=basics#overview", label: "Help" };

    writeNavPinnedLinks([link]);

    expect(readNavPinnedLinks()).toEqual([link]);
    expect(toggleNavPinnedLink(readNavPinnedLinks(), { href: link.href, label: "" })).toEqual([]);
  });

  it.each([
    ["external URL", "https://evil.example/steal"],
    ["javascript URL", "javascript:alert(1)"],
    ["protocol-relative URL", "//evil.example/steal"],
    ["encoded slash", "/%2f%2fevil.example/steal"],
    ["backslash", "/\\evil.example/steal"],
    ["control character", "/help/\u0009getting-started"],
  ])("rejects %s from stored pins, writes and in-memory toggles", (_description, href) => {
    const malicious = { href, label: "Unsafe" };
    const safe = { href: "/help/getting-started", label: "Help" };
    window.localStorage.setItem("archlucid.navPinnedLinks.v1", JSON.stringify([malicious, safe]));

    expect(readNavPinnedLinks()).toEqual([safe]);
    expect(toggleNavPinnedLink([safe], malicious)).toEqual([safe]);

    writeNavPinnedLinks([malicious, safe]);
    expect(readNavPinnedLinks()).toEqual([safe]);
    expect(JSON.parse(window.localStorage.getItem("archlucid.navPinnedLinks.v1") ?? "[]")).toEqual([safe]);
  });

  it("ignores storage entries that are not valid pinned link records", () => {
    window.localStorage.setItem(
      "archlucid.navPinnedLinks.v1",
      JSON.stringify([null, "invalid", { href: "/help", label: null }, { href: "/help", label: "  " }]),
    );

    expect(readNavPinnedLinks()).toEqual([]);
  });

  it("does not publish a newly pinned empty-label entry but still supports unpin", () => {
    expect(toggleNavPinnedLink([], { href: "/help", label: "" })).toEqual([]);
    expect(toggleNavPinnedLink([{ href: "/help", label: "Help" }], { href: "/help", label: "" })).toEqual([]);
  });

});
