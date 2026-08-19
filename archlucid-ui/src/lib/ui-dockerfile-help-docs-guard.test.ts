import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { isTypedHelpGuideSlug } from "@/lib/help/help-typed-guide-slugs";
import { listProductDocumentationEntries } from "@/lib/product-documentation-registry";

/** Ensures Container Apps UI images ship markdown for non-typed `/help/{topic}` routes. */
describe("ui Dockerfile help docs packaging", () => {
  const dockerfile = readFileSync(path.join(process.cwd(), "Dockerfile"), "utf8");

  it("copies customer-facing help markdown into the runtime image", () => {
    expect(dockerfile).toContain(
      "COPY --chown=archlucid:archlucid docs/library/customer-facing /docs/library/customer-facing",
    );
  });

  it("keeps getting-started as a typed guide so missing markdown cannot 404 that topic", () => {
    expect(isTypedHelpGuideSlug("getting-started")).toBe(true);

    const entry = listProductDocumentationEntries().find((row) => row.slug === "getting-started");

    expect(entry?.sourcePaths[0]).toBe("docs/library/customer-facing/CONCEPTS_IN_5_MINUTES.md");
  });
});
