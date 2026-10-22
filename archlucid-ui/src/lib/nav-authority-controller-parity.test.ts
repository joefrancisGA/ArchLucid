import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { flattenNavLinks } from "@/lib/nav-config";
import { IMPACT_PREVIEW_PATH } from "@/lib/impact-preview-route";
import {
  resolveNavLinkPresentation,
  resolveReviewsListNavLinkLabel,
} from "@/lib/operator/operator-nav-labels";
import { getRouteTitle } from "@/lib/route-titles";
import { ROUTE_TITLES } from "@/lib/route-static-titles";

const REPO_ROOT = join(process.cwd(), "..");

type ParityManifestEntry = {
  readonly nav_href: string;
  readonly nav_required_authority: string;
  readonly parity: string;
  readonly exemption?: string;
};

type ParityManifest = {
  readonly version: number;
  readonly entries: readonly ParityManifestEntry[];
};

function loadParityManifest(): ParityManifest {
  const raw = readFileSync(
    join(REPO_ROOT, "scripts/ci/data/nav_authority_controller_parity_manifest.json"),
    "utf8",
  );

  return JSON.parse(raw) as ParityManifest;
}

/** TB-882 — Vitest mirror of scripts/ci/check_nav_authority_controller_parity.py */
describe("nav authority controller parity (TB-882)", () => {
  it("keeps flattenNavLinks requiredAuthority aligned with the committed parity manifest", () => {
    const manifest = loadParityManifest();
    const navByHref = new Map(
      flattenNavLinks()
        .filter((link) => link.requiredAuthority !== undefined)
        .map((link) => [link.href.split("?")[0] ?? link.href, link.requiredAuthority] as const),
    );

    const mismatches: string[] = [];

    for (const entry of manifest.entries) {
      const navAuth = navByHref.get(entry.nav_href);

      if (navAuth === undefined) {
        continue;
      }

      if (navAuth !== entry.nav_required_authority) {
        mismatches.push(
          `${entry.nav_href}: nav-config=${navAuth} manifest=${entry.nav_required_authority}`,
        );
      }
    }

    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });

  it("documents no non-exempt nav/controller authority drift in the manifest", () => {
    const manifest = loadParityManifest();
    const drift = manifest.entries.filter(
      (entry) =>
        entry.parity !== "match"
        && entry.parity !== "unmapped"
        && entry.exemption === undefined,
    );

    expect(drift, JSON.stringify(drift, null, 2)).toEqual([]);
  });

  it("wires the Python parity guard for CI discovery", () => {
    const source = readFileSync(
      join(REPO_ROOT, "scripts/ci/check_nav_authority_controller_parity.py"),
      "utf8",
    );

    expect(source).toContain("TB-882");
    expect(source).toContain("nav_looser_than_controller");
    expect(source).toContain("nav_stricter_than_controller");
  });
});

/**
 * Curated operator surfaces whose page H1 must match sidebar label after buyer/governance presentation.
 * General href coverage lives in nav-route-title-parity.test.ts; these rows cover presentation overrides.
 */
const OPERATOR_NAV_HEADING_PARITY_SURFACES: readonly { href: string; governanceMode?: boolean }[] = [
  { href: "/architecture/reviews" },
  { href: "/architecture/reviews", governanceMode: true },
  { href: IMPACT_PREVIEW_PATH },
  { href: "/internal/trial-funnel" },
];

describe("operator nav heading parity (TB-882)", () => {
  it.each(OPERATOR_NAV_HEADING_PARITY_SURFACES)(
    "$href heading matches sidebar label (governanceMode=$governanceMode)",
    ({ href, governanceMode = false }) => {
      const link = flattenNavLinks().find((row) => row.href.split("?")[0] === href);

      expect(link, `missing nav-config row for ${href}`).toBeDefined();

      const presentation = resolveNavLinkPresentation(
        { href: link!.href, label: link!.label, title: link!.title },
        true,
        governanceMode,
      );
      const routeTitle = getRouteTitle(href);

      expect(routeTitle).toBe(presentation.label);
    },
  );

  it("TB-606: reviews list presentation label matches route title registry", () => {
    expect(resolveReviewsListNavLinkLabel(false)).toBe(ROUTE_TITLES["/architecture/reviews"]);
    expect(resolveReviewsListNavLinkLabel(true)).toBe(ROUTE_TITLES["/architecture/reviews"]);
  });
});
