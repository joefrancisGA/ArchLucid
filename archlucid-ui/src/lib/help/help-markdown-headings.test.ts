import { describe, expect, it } from "vitest";

import { extractHelpMarkdownHeadings } from "@/lib/help/help-markdown-headings";

describe("extractHelpMarkdownHeadings", () => {
  it("extracts h2 and h3 headings with stable slugs", () => {
    const headings = extractHelpMarkdownHeadings(`## First section\n\n### Nested topic\n\n## Second section`);

    expect(headings).toEqual([
      { level: 2, id: "first-section", title: "First section" },
      { level: 3, id: "nested-topic", title: "Nested topic" },
      { level: 2, id: "second-section", title: "Second section" },
    ]);
  });

  it("uses explicit anchors and strips them from visible titles", () => {
    const headings = extractHelpMarkdownHeadings(`## Workforce SSO {#workforce-sso}\n\n### SAML claim-mapping reference {#saml-claim-mapping-reference}`);

    expect(headings).toEqual([
      { level: 2, id: "workforce-sso", title: "Workforce SSO" },
      { level: 3, id: "saml-claim-mapping-reference", title: "SAML claim-mapping reference" },
    ]);
  });
});
