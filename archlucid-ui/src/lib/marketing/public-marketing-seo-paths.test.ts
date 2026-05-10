import { describe, expect, it } from "vitest";

import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "./public-marketing-seo-paths";

describe("MARKETING_SITEMAP_PATHNAMES", () => {
  it("are unique POSIX-style pathnames rooted at slash without trailing slashes", () => {
    expectNoDuplicates(MARKETING_SITEMAP_PATHNAMES);

    for (const pathname of MARKETING_SITEMAP_PATHNAMES) {
      expect(pathname.startsWith("/")).toBe(true);
      expect(pathname.endsWith("/")).toBe(false);
      expect(pathname.includes("//")).toBe(false);
    }
  });
});

describe("MARKETING_ROBOTS_DISALLOW_PREFIXES", () => {
  it("never uses bare '/' disallow (RFC prefix rules would forbid the entire host)", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).not.toContain("/");
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES.some((entry) => entry.trim() === "/")).toBe(false);
  });

  it("does not disallow any marketing-sitemap pathname", () => {
    for (const allowPath of MARKETING_SITEMAP_PATHNAMES) {
      for (const disallow of MARKETING_ROBOTS_DISALLOW_PREFIXES) {
        if (marketingPathOverlapsRobotsPrefix(allowPath, disallow)) {
          throw new Error(
            `overlap: sitemap '${allowPath}' blocked by robots disallow '${disallow}'`,
          );
        }
      }
    }
  });
});

/** Local helper — asserts array elements are distinct (fail with duplicate value). */
function expectNoDuplicates(pathnames: readonly string[]): void {
  const seen = new Set<string>();

  for (const pathname of pathnames) {

    if (seen.has(pathname)) {

      throw new Error(`duplicate pathname: ${pathname}`);
    }

    seen.add(pathname);
  }
}

/** True if crawler would treat disallow as blocking this pathname (Google-style longest-prefix match). */
function marketingPathOverlapsRobotsPrefix(allowPath: string, disallowRaw: string): boolean {
  if (allowPath === disallowRaw) {
    return true;
  }

  const normalized = disallowRaw.endsWith("/") ? disallowRaw.slice(0, -1) : disallowRaw;

  return allowPath === normalized || allowPath.startsWith(`${normalized}/`);
}
