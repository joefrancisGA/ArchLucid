import { describe, expect, it } from "vitest";

import { secureNowTitleCase } from "./securenow-title-case";

describe("secureNowTitleCase", () => {
  it("capitalizes significant words and preserves lowercase connecting words", () => {
    expect(secureNowTitleCase("Extract & upload")).toBe("Extract & Upload");
    expect(secureNowTitleCase("Assigned to me")).toBe("Assigned to Me");
    expect(secureNowTitleCase("Audit evidence lineage")).toBe("Audit Evidence Lineage");
  });

  it("preserves product acronyms", () => {
    expect(secureNowTitleCase("ARC-AMPE compliance")).toBe("ARC-AMPE Compliance");
  });
});
