import { describe, expect, it } from "vitest";

import { DOCUMENTATION_SEARCH_ITEMS, resolveDocumentationHref } from "./docs-search-index";
import { isInternalRunbookSlug } from "./product-documentation-content-kinds";
import { tryResolveInAppDocHref } from "./in-app-doc-href";

describe("docs-search-index", () => {
  it("indexes curated product docs for Ctrl+K search", () => {
    expect(DOCUMENTATION_SEARCH_ITEMS.length).toBeGreaterThanOrEqual(15);
  });

  it("uses docs paths under docs/", () => {
    for (const row of DOCUMENTATION_SEARCH_ITEMS) {
      expect(row.relativeDocsPath.startsWith("docs/"), row.relativeDocsPath).toBe(true);
      expect(row.title.length).toBeGreaterThan(0);
      expect(row.category.length).toBeGreaterThan(0);
    }
  });

  it("resolves curated docs to in-app help routes", () => {
    expect(resolveDocumentationHref("docs/CORE_PILOT.md")).toBe("/help/first-architecture-review");
    expect(resolveDocumentationHref("docs/runbooks/TROUBLESHOOTING.md")).toMatch(/^\/help\//);
  });

  it("indexes first architecture review without first-pilot checklist jargon (TB-1380)", () => {
    const corePilot = DOCUMENTATION_SEARCH_ITEMS.find((row) => row.relativeDocsPath === "docs/CORE_PILOT.md");

    expect(corePilot).toBeDefined();
    expect(corePilot?.title).toBe("Your first architecture review");
    expect(corePilot?.description.toLowerCase()).not.toContain("first-pilot");
    expect(corePilot?.description.toLowerCase()).not.toContain("manifest");
  });

  it("indexes customer troubleshooting instead of engineering runbooks (TB-2237)", () => {
    const troubleshooting = DOCUMENTATION_SEARCH_ITEMS.find(
      (row) => row.relativeDocsPath === "docs/library/customer-facing/operator_troubleshooting.md",
    );

    expect(troubleshooting).toBeDefined();
    expect(resolveDocumentationHref(troubleshooting!.relativeDocsPath)).toBe("/help/troubleshooting");
    expect(
      DOCUMENTATION_SEARCH_ITEMS.some((row) => row.relativeDocsPath.toLowerCase().startsWith("docs/runbooks/")),
    ).toBe(false);
  });

  it("omits Admin-only internal-runbook topics from Ctrl+K documentation search (TB-1385)", () => {
    expect(
      DOCUMENTATION_SEARCH_ITEMS.some((row) => row.relativeDocsPath.toLowerCase().includes("api_contracts")),
    ).toBe(false);

    for (const row of DOCUMENTATION_SEARCH_ITEMS) {
      const href = tryResolveInAppDocHref(row.relativeDocsPath);
      const slug = href?.replace(/^\/help\/?/, "").split("#")[0] ?? "";

      expect(slug.length === 0 || !isInternalRunbookSlug(slug), row.relativeDocsPath).toBe(true);
    }

    expect(resolveDocumentationHref("docs/library/API_CONTRACTS.md")).toBe("/help/api-contracts");
  });
});
