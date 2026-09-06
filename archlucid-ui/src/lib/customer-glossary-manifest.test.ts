import { describe, expect, it } from "vitest";

import {
  CUSTOMER_GLOSSARY_TERMS,
  filterGlossaryTermsByQuery,
  glossaryTermsForCategory,
  listCustomerFacingGlossaryTerms,
  sortGlossaryTermsAlphabetically,
  buildGlossaryTermLabelIndex,
} from "@/lib/customer-glossary-manifest";

const BANNED_CUSTOMER_GLOSSARY_PATTERNS = [
  /implementation alignment/i,
  /ArchLucid\.[A-Z]/,
  /payload/i,
  /\benum\b/i,
  /serialization/i,
  /database-backed/i,
  /canonical read/i,
  /record-type field taxonomy/i,
  /docs\/library\//i,
  /TenantId/,
  /WorkspaceId/,
] as const;

describe("customer-glossary-manifest", () => {
  it("exposes only customer-visible terms in the public list", () => {
    const customerTerms = listCustomerFacingGlossaryTerms();

    expect(customerTerms.length).toBeGreaterThan(10);
    expect(customerTerms.every((term) => term.visibility === "customer")).toBe(true);
    expect(CUSTOMER_GLOSSARY_TERMS.some((term) => term.visibility === "internal-only")).toBe(false);
  });

  it("uses Sealed review record as the preferred label, not Signed manifest", () => {
    const signedTerm = listCustomerFacingGlossaryTerms().find((term) => term.id === "sealed-review-record");

    expect(signedTerm?.label).toBe("Sealed review record");
    expect(signedTerm?.deprecatedAliases).toContain("Signed review record");
    expect(signedTerm?.deprecatedAliases).toContain("Signed manifest");
    expect(listCustomerFacingGlossaryTerms().some((term) => term.label === "Signed manifest")).toBe(false);
  });

  it("sorts terms alphabetically by label", () => {
    const sorted = sortGlossaryTermsAlphabetically(listCustomerFacingGlossaryTerms());
    const labels = sorted.map((term) => term.label);

    expect(labels).toEqual([...labels].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" })));
  });

  it("filters by category and search query including aliases and related terms", () => {
    const customerTerms = listCustomerFacingGlossaryTerms();
    const labelIndex = buildGlossaryTermLabelIndex(customerTerms);
    const evidenceTerms = glossaryTermsForCategory(customerTerms, "evidence");

    expect(evidenceTerms.every((term) => term.category === "evidence")).toBe(true);

    const manifestMatches = filterGlossaryTermsByQuery(customerTerms, "signed manifest", labelIndex);

    expect(manifestMatches.some((term) => term.id === "sealed-review-record")).toBe(true);

    const riskRelated = filterGlossaryTermsByQuery(customerTerms, "control", labelIndex);

    expect(riskRelated.some((term) => term.id === "risk")).toBe(true);
  });

  it("keeps customer definitions free of internal implementation language", () => {
    const haystack = listCustomerFacingGlossaryTerms()
      .flatMap((term) => [term.label, term.definition, term.detail ?? "", ...(term.aliases ?? []), ...(term.deprecatedAliases ?? [])])
      .join("\n");

    for (const pattern of BANNED_CUSTOMER_GLOSSARY_PATTERNS) {
      expect(haystack).not.toMatch(pattern);
    }
  });

  it("defines Architecture as a durable identity distinct from drafts (CA-44)", () => {
    const architecture = listCustomerFacingGlossaryTerms().find((term) => term.id === "architecture");

    expect(architecture?.label).toBe("Architecture");
    expect(architecture?.definition.toLowerCase()).toContain("durable");
    expect(architecture?.definition.toLowerCase()).toContain("identity");
    expect(architecture?.definition.toLowerCase()).not.toContain("draft editor");
  });

  it("does not read architecture draft as the whole Architectures workspace (CA-44)", () => {
    const draft = listCustomerFacingGlossaryTerms().find((term) => term.id === "architecture-draft");

    expect(draft?.definition.toLowerCase()).toContain("child");
    expect(draft?.definition.toLowerCase()).not.toMatch(/architectures workspace is/);
    expect(draft?.relatedTermIds).toContain("architecture");
  });
});
