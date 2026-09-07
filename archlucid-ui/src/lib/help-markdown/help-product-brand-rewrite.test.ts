import { describe, expect, it } from "vitest";

import { applyHelpProductBrandRewrite } from "@/lib/help-markdown/help-product-brand-rewrite";

describe("applyHelpProductBrandRewrite", () => {
  it("leaves architecture markdown unchanged", () => {
    const source = "ArchLucid ingests evidence and ArchLucid ships exports.";

    expect(applyHelpProductBrandRewrite(source, "architecture")).toBe(source);
  });

  it("rewrites consumer product mentions to SecureNow on the security line", () => {
    const source = "ArchLucid ingests evidence and returns findings.";

    expect(applyHelpProductBrandRewrite(source, "security")).toBe(
      "SecureNow ingests evidence and returns findings.",
    );
  });

  it("preserves script placeholders and company/legal lines", () => {
    const markdown = [
      "Use {ArchLucid tenant ID} in the trust policy.",
      "ArchLucid uses the following **subprocessors** to deliver the hosted service.",
      "Contact security@archlucid.net for diligence.",
      "```json",
      '{ "issuer": "{ArchLucid tenant ID}" }',
      "```",
    ].join("\n");

    const rewritten = applyHelpProductBrandRewrite(markdown, "security");

    expect(rewritten).toContain("{ArchLucid tenant ID}");
    expect(rewritten).toContain("ArchLucid uses the following **subprocessors**");
    expect(rewritten).toContain("security@archlucid.net");
    expect(rewritten).not.toMatch(/\bArchLucid ingests\b/);
  });
});
