import { describe, expect, it } from "vitest";

import { formatManifestDocumentShape } from "./export-markdown-manifest-document";

describe("formatManifestDocumentShape component breakdown", () => {
  it("reports missing collections instead of calling them present", () => {
    const markdown = formatManifestDocumentShape({
      topology: {
        services: null,
        datastores: [],
        relationships: [],
      },
      decisions: [],
    });

    expect(markdown).toContain("Services were not stored.");
    expect(markdown).not.toContain("_No services, datastores, relationships, or decisions were present._");
  });

  it("keeps the all-empty stored collection sentence", () => {
    const markdown = formatManifestDocumentShape({
      topology: {
        services: [],
        datastores: [],
        relationships: [],
      },
      decisions: [],
    });

    expect(markdown).toContain("_No services, datastores, relationships, or decisions were present._");
  });
});
