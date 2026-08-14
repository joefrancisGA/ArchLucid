import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CANONICAL_AUTH_SIGNIN_PATH,
  LEGACY_LOGIN_PATH,
} from "@/lib/legacy-login-route";
import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { REMOVED_LEGACY_LOGIN_TRAFFIC_ROW_ID } from "@/lib/ui-route-traffic-retired-legacy-login";

const LEGACY_LOGIN_PATH_PATTERN = /\/login(?![-\w])/g;
const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");
const LEGACY_PATH_ALLOWED_ON_LINE =
  /redirect|retired|legacy|deprecated|bookmark|301|noindex|unreachable|removed|canonical|alias|shim|auth\/signin|session-expired|lox|asi/i;

const CONTRIBUTOR_DOC_PATHS = [
  "docs/architecture/information_architecture_assessment_and_backlog.md",
  "docs/architecture/ui_routes.md",
] as const;

const CUSTOMER_FACING_DOC_PATHS = [
  "docs/library/customer-facing/AUTHENTICATION_AND_SIGN_IN.md",
  "docs/library/contributor-reference/AUTHENTICATION_CONFIGURATION.md",
] as const;

const AUTHENTICATION_SIGN_IN_HELP_SOURCE_PATHS = [
  "src/lib/authentication-sign-in-help-copy.ts",
  "src/lib/authentication-sign-in-help-guide-content.ts",
  "src/lib/authentication-sign-in-help-evidence-copy.ts",
  "src/app/(operator)/help/_sections/HelpAuthenticationSignInActionPanel.tsx",
] as const;

const LEGACY_LOGIN_ROUTE_PATTERN = /["'`]\/login["'`]/;

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

  it("does not teach /login as the sign-in URL in customer-facing auth docs (TB-1795)", () => {
    for (const relativePath of CUSTOMER_FACING_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyLoginPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy login path in ${relativePath}`).toEqual([]);
    }
  });

  it("points authentication-sign-in help CTAs at /auth/signin, not /login (TB-1795)", () => {
    for (const relativePath of AUTHENTICATION_SIGN_IN_HELP_SOURCE_PATHS) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      expect(source, `legacy /login route in ${relativePath}`).not.toMatch(LEGACY_LOGIN_ROUTE_PATTERN);
    }

    const primaryActionSource = readFileSync(
      join(process.cwd(), "src/lib/authentication-sign-in-help-copy.ts"),
      "utf8",
    );

    expect(primaryActionSource).toContain(CANONICAL_AUTH_SIGNIN_PATH);
  });

  it("does not track retired LOG in the traffic workbook template", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const logRow = rows.find((row) => row.id === REMOVED_LEGACY_LOGIN_TRAFFIC_ROW_ID);

    expect(logRow).toBeUndefined();
  });

  it("migrates /login to /auth/signin in Python WORKBOOK_PATH_MIGRATIONS (TB-1794)", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    expect(catalogSource).toContain('"/login": "/auth/signin"');
  });
});
