import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { AUTH_SIGNIN_PATH } from "@/lib/auth-operator-route-paths";
import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import {
  CANONICAL_AUTH_SIGNIN_TRAFFIC_PATH,
  REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS,
  RETIRED_LOGIN_BOOKMARK_PATH,
  RETIRED_ONBOARD_BOOKMARK_PATH,
  RETIRED_ONBOARDING_START_BOOKMARK_PATH,
  RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH,
} from "@/lib/ui-route-traffic-retired-redirect-shims";

const LEGACY_LOGIN_PATH_PATTERN = /\/login(?![-\w])/g;
const CATALOG_PATH = join(process.cwd(), "..", "scripts", "ci", "archlucid_ui_route_catalog.py");
const LEGACY_PATH_ALLOWED_ON_LINE =
  /redirect|retired|legacy|deprecated|bookmark|301|noindex|unreachable|removed|canonical|alias|shim|auth\/signin|session-expired|lox|asi|oxx|osx|oax/i;

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

const RETIRED_BOOKMARK_PYTHON_MIGRATION_SNIPPETS = [
  '"/login": "/auth/signin"',
  '"/onboard": "/architecture/first-review-guide"',
  '"/onboarding/start": "/architecture/first-review-guide"',
  '"/operate/architecture-graph": "/insights/evidence-graph"',
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

describe("retired-redirect-shim-bookmarks-doc-guard (LOG / OXX / OSX / OAX removed)", () => {
  it("documents canonical auth sign-in and retired bookmark paths", () => {
    expect(AUTH_SIGNIN_PATH).toBe("/auth/signin");
    expect(RETIRED_LOGIN_BOOKMARK_PATH).toBe("/login");
    expect(RETIRED_ONBOARD_BOOKMARK_PATH).toBe("/onboard");
    expect(RETIRED_ONBOARDING_START_BOOKMARK_PATH).toBe("/onboarding/start");
    expect(RETIRED_OPERATE_ARCHITECTURE_GRAPH_BOOKMARK_PATH).toBe("/operate/architecture-graph");
  });

  it("labels /login as retired or redirect-only in contributor docs", () => {
    for (const relativePath of CONTRIBUTOR_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyLoginPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy login path in ${relativePath}`).toEqual([]);
    }
  });

  it("does not teach /login as the sign-in URL in customer-facing auth docs", () => {
    for (const relativePath of CUSTOMER_FACING_DOC_PATHS) {
      const violations = linesWithUnlabeledLegacyLoginPath(readRepoRelativeDoc(relativePath));

      expect(violations, `unlabeled legacy login path in ${relativePath}`).toEqual([]);
    }
  });

  it("points authentication-sign-in help CTAs at /auth/signin, not /login", () => {
    for (const relativePath of AUTHENTICATION_SIGN_IN_HELP_SOURCE_PATHS) {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      expect(source, `legacy /login route in ${relativePath}`).not.toMatch(LEGACY_LOGIN_ROUTE_PATTERN);
    }

    const primaryActionSource = readFileSync(
      join(process.cwd(), "src/lib/authentication-sign-in-help-copy.ts"),
      "utf8",
    );

    expect(primaryActionSource).toContain(AUTH_SIGNIN_PATH);
  });

  it("does not track retired redirect shim rows in the traffic workbook template", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    for (const rowId of REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS) {
      expect(rows.find((row) => row.id === rowId)).toBeUndefined();
    }
  });

  it("keeps sign-in on ASI without LOG cross-reference notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const signInRow = rows.find((row) => row.id === "ASI");

    expect(signInRow?.path).toBe(CANONICAL_AUTH_SIGNIN_TRAFFIC_PATH);
    expect(signInRow?.notes.toLowerCase()).not.toContain("log = legacy /login");
  });

  it("does not migrate retired bookmark paths in Python WORKBOOK_PATH_MIGRATIONS", () => {
    const catalogSource = readFileSync(CATALOG_PATH, "utf8");

    for (const snippet of RETIRED_BOOKMARK_PYTHON_MIGRATION_SNIPPETS) {
      expect(catalogSource).not.toContain(snippet);
    }
  });
});
