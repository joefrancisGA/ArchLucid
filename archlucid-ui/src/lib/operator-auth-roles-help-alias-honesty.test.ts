import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { USERS_AND_ROLES_HELP_CANONICAL_PATH } from "@/lib/users-and-roles-help-evidence-copy";

const HELP_CATCH_ALL_PAGE_PATH = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "help",
  "[...topic]",
  "page.tsx",
);

const RETIRED_OPERATOR_AUTH_ROLES_HELP_ALIAS_PATH = "/help/operator-auth-roles";

const BUYER_HELP_DEEP_LINK_SURFACES = [
  "src/lib/users-and-roles-help-evidence-copy.ts",
  "src/lib/configuration-reference-help-guide-content.ts",
  "src/lib/help-search-panel-catalog.ts",
] as const;

const BANNED_OPERATOR_AUTH_ROLES_BUYER_COPY = [
  RETIRED_OPERATOR_AUTH_ROLES_HELP_ALIAS_PATH,
  "operator-auth-roles",
  "Operator auth roles",
] as const;

describe("operator-auth-roles help alias honesty (TB-1707)", () => {
  it("permanently redirects retired bookmarks before help topic render", () => {
    expect(resolveHelpTopicPermanentRedirect("operator-auth-roles")).toBe(USERS_AND_ROLES_HELP_CANONICAL_PATH);
    expect(getProductDocumentationEntry("operator-auth-roles")).toBeNull();

    const pageSource = readFileSync(HELP_CATCH_ALL_PAGE_PATH, "utf8");
    const permanentRedirectIndex = pageSource.indexOf("resolveHelpTopicPermanentRedirect");
    const entryLookupIndex = pageSource.indexOf("getProductDocumentationEntry(slug)");

    expect(permanentRedirectIndex).toBeGreaterThanOrEqual(0);
    expect(entryLookupIndex).toBeGreaterThan(permanentRedirectIndex);
    expect(pageSource).toContain("permanentRedirect(permanentRedirectTarget)");
  });

  it.each(BUYER_HELP_DEEP_LINK_SURFACES)(
    "keeps %s free of operator-auth-roles help path or copy",
    (relativePath) => {
      const source = readFileSync(join(process.cwd(), relativePath), "utf8");

      for (const banned of BANNED_OPERATOR_AUTH_ROLES_BUYER_COPY) {
        expect(source, `${relativePath} must not contain "${banned}"`).not.toContain(banned);
      }
    },
  );
});
