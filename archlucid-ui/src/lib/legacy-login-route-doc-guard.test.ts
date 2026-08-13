import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CANONICAL_AUTH_SIGNIN_PATH,
  LEGACY_LOGIN_PATH,
} from "@/lib/legacy-login-route";
import { LEGACY_LOGIN_TRAFFIC_NOTE } from "@/lib/ui-route-traffic-legacy-login";

const LEGACY_LOGIN_PATH_PATTERN = /\/login(?![-\w])/g;
const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");
const LEGACY_PATH_ALLOWED_ON_LINE =
  /redirect|retired|legacy|deprecated|bookmark|301|noindex|unreachable|removed|canonical|alias|shim|auth\/signin|session-expired|lox|asi/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/information_architecture_assessment_and_backlog.md",
  "docs/architecture/ui_routes.md",
] as const;

function readRepoRelativeDoc(relativePath: string): string {
  return readFileSync(join(process.cwd(), "..", relativePath), "utf8");
}

function linesWithUnlabeledLegacyLoginPath(markdown: string): string[] {
  const violations: string[] = [];

  for (const line of markdown.split("\n")) {
    if (!LEGACY_LOGIN_PATH_PATTERN.test(line)) {
      continue;
    }

    if (!LEGACY_PATH_ALLOWED_ON_LINE.test(line)) {
      violations.push(line.trim());
    }
  }

  return violations;
}

describe("legacy-login-route-doc-guard (TB-1795)", () => {
  it("documents the canonical auth sign-in path as the buyer URL", () => {
    expect(CANONICAL_AUTH_SIGNIN_PATH).toBe("/auth/signin");
    expect(LEGACY_LOGIN_PATH).toBe("/login");
  });

  it("labels /login as retired or redirect-only in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyLoginPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy login path in ${relativePath}`).toEqual([]);
    }
  });

  it("does not present the legacy login path as a live marketing surface in traffic notes", () => {
    expect(LEGACY_LOGIN_TRAFFIC_NOTE.toLowerCase()).toContain("legacy");
    expect(LEGACY_LOGIN_TRAFFIC_NOTE).toContain("/auth/signin");
    expect(LEGACY_LOGIN_TRAFFIC_NOTE).toContain("/auth/session-expired");
    expect(LEGACY_LOGIN_TRAFFIC_NOTE).not.toMatch(/live marketing/i);
  });

  it("migrates /login to /auth/signin in Python WORKBOOK_PATH_MIGRATIONS (TB-1794)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('"/login": "/auth/signin"');
  });
});
