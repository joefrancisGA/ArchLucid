import { describe, expect, it } from "vitest";

import {
  countConfigurationReferenceHelpCatalogKeys,
  filterConfigurationReferenceHelpCatalogMarkdown,
} from "@/lib/configuration-reference-help-catalog";

const SAMPLE_MARKDOWN = `# Keys

| Key | Description |
| --- | --- |
| ArchLucid__Auth__Mode | Auth mode |
| ConnectionStrings__Default | Database |
| Feature__Pilot | Pilot flag |
`;

describe("configuration-reference-help-catalog", () => {
  it("counts configuration key table rows", () => {
    expect(countConfigurationReferenceHelpCatalogKeys(SAMPLE_MARKDOWN)).toBe(3);
  });

  it("filters table rows by query", () => {
    const filtered = filterConfigurationReferenceHelpCatalogMarkdown(SAMPLE_MARKDOWN, "auth");

    expect(filtered).toContain("ArchLucid__Auth__Mode");
    expect(filtered).not.toContain("ConnectionStrings__Default");
    expect(countConfigurationReferenceHelpCatalogKeys(filtered)).toBe(1);
  });
});
