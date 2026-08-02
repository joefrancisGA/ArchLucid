import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import nextConfig from "../../next.config";

import { LEGACY_SNAPSHOT_ROUTE_METADATA } from "@/lib/legacy-snapshot-route-metadata";
import {
  LEGACY_SNAPSHOT_INBOUND_QUERY_POLICY_NOTE,
  LEGACY_SNAPSHOT_PATH_PATTERN,
  LEGACY_SNAPSHOT_PATH_PREFIX,
} from "@/lib/legacy-snapshot-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

const SNAPSHOT_APP_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "snapshot",
  "[runId]",
  "page.tsx",
);
const SNAPSHOT_APP_LAYOUT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "snapshot",
  "[runId]",
  "layout.tsx",
);

const BANNED_CLIENT_IMPORT_PATTERNS = ['"use client"', "SnapshotPageClient", "ExecutiveDashboard"] as const;

const SNAPSHOT_LEAVE_BEHIND_SURFACES = ["archlucid-ui/src/lib/buyer-cto-demo-recap.ts"] as const;

const UI_ROUTES_DOC = join(process.cwd(), "..", "docs", "architecture", "ui_routes.md");
const IA_ASSESSMENT_DOC = join(
  process.cwd(),
  "..",
  "docs",
  "architecture",
  "information_architecture_assessment_and_backlog.md",
);

describe("legacy-snapshot-route (TB-1951 / TB-1952 / TB-1953 / TB-1954)", () => {
  it("marks the legacy shim as noindex with honest metadata", () => {
    expect(LEGACY_SNAPSHOT_ROUTE_METADATA.robots).toEqual({ index: false, follow: false });
    expect(LEGACY_SNAPSHOT_ROUTE_METADATA.title).toContain("Redirect");
    expect(LEGACY_SNAPSHOT_ROUTE_METADATA.description?.toLowerCase()).toContain("legacy");
    expect(LEGACY_SNAPSHOT_ROUTE_METADATA.description).toContain("readOnly=1");
  });

  it("ships redirect-only App Router page and layout metadata", () => {
    const pageSource = readFileSync(SNAPSHOT_APP_PAGE, "utf8");
    const layoutSource = readFileSync(SNAPSHOT_APP_LAYOUT, "utf8");

    expect(pageSource).toContain("redirect(");
    expect(pageSource).toContain("buildSnapshotRedirectPath");
    expect(layoutSource).toContain("LEGACY_SNAPSHOT_ROUTE_METADATA");

    for (const bannedPattern of BANNED_CLIENT_IMPORT_PATTERNS) {
      expect(pageSource).not.toContain(bannedPattern);
    }
  });

  it("keeps marketing SEO inventory off /snapshot while robots disallow it", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_SNAPSHOT_PATH_PREFIX);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_SNAPSHOT_PATH_PATTERN);
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_SNAPSHOT_PATH_PREFIX);
  });

  it("keeps CTO recap leave-behind links on /snapshot alongside review package URLs (TB-1952)", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of SNAPSHOT_LEAVE_BEHIND_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");
      expect(source).toContain("/snapshot/");
      expect(source).toContain("/reviews/");
      expect(source).toContain("SHOWCASE_STATIC_DEMO_RUN_ID");
    }
  });

  it("canonicalizes /snapshot docs as redirect-only shim, not a T1 page (TB-1954)", () => {
    const uiRoutes = readFileSync(UI_ROUTES_DOC, "utf8");
    const snapshotRow = uiRoutes
      .split("\n")
      .find((line) => line.includes("`/snapshot/[runId]`"));

    expect(snapshotRow).toBeDefined();
    expect(snapshotRow).toContain("redirect-only shim");
    expect(snapshotRow).toContain("readOnly=1");
    expect(snapshotRow).not.toMatch(/\bT1:/);

    const iaAssessment = readFileSync(IA_ASSESSMENT_DOC, "utf8");
    const iaSnapshotRow = iaAssessment
      .split("\n")
      .find((line) => line.includes("`/snapshot/[runId]`"));

    expect(iaSnapshotRow).toBeDefined();
    expect(iaSnapshotRow).toContain("redirect only");
    expect(iaSnapshotRow).not.toContain("executive leave-behind");
  });

  it("documents inbound query preservation and keeps /snapshot off next.config redirects (TB-1953)", async () => {
    expect(LEGACY_SNAPSHOT_INBOUND_QUERY_POLICY_NOTE).toContain("v=demo");
    expect(LEGACY_SNAPSHOT_INBOUND_QUERY_POLICY_NOTE).toContain("readOnly=1");
    expect(LEGACY_SNAPSHOT_ROUTE_METADATA.description).toContain("v=demo");

    const redirectRules = await nextConfig.redirects?.();

    expect(
      redirectRules?.some(
        (rule) =>
          rule.source === LEGACY_SNAPSHOT_PATH_PREFIX ||
          rule.source.startsWith(`${LEGACY_SNAPSHOT_PATH_PREFIX}/`),
      ),
    ).toBe(false);
  });
});
