import { describe, expect, it } from "vitest";

import {
  DATA_HANDLING_TENANT_ISOLATION_CANONICAL_SOURCE_SUFFIX,
  dataHandlingTenantIsolationMarkdownIsCompliant,
  findDataHandlingTenantIsolationDriftViolations,
} from "@/lib/help/data-handling-tenant-isolation-help-drift-contract";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const REMEDIATION =
  "Keep `/help/data-handling` on DATA_HANDLING.md with Three layers + explicit non-claims; "
  + "do not regress to TENANT_ISOLATION stub-only bodies (TB-1660).";

describe("data-handling tenant-isolation help drift guard (TB-1660)", () => {
  it("fails stub-only isolation bodies without Three layers enumeration", () => {
    const stubBody = [
      "**Canonical buyer overview:** path-stable procurement-pack alias.",
      "",
      "Three-layer isolation lives only in the buyer security packet.",
      "",
      "See verification-pack generation in scripts/.",
    ].join("\n");

    const violations = findDataHandlingTenantIsolationDriftViolations(stubBody, {
      sourcePath: "docs/go-to-market/TENANT_ISOLATION.md",
    });

    expect(violations.map((violation) => violation.code)).toEqual(
      expect.arrayContaining(["missing-three-layers", "missing-non-claims", "missing-layer-enumeration", "stub-dominated", "stub-source-path"]),
    );
  });

  it("loads canonical data-handling markdown with Three layers + non-claims", () => {
    const loaded = tryLoadProductDocumentation("data-handling");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const violations = findDataHandlingTenantIsolationDriftViolations(loaded!.markdown, {
      sourcePath,
    });

    expect(violations, REMEDIATION).toEqual([]);
    expect(sourcePath.replace(/\\/g, "/")).toContain(DATA_HANDLING_TENANT_ISOLATION_CANONICAL_SOURCE_SUFFIX);
  });

  it("keeps presented markdown buyer-safe and non-stub after presentation prep", () => {
    const loaded = tryLoadProductDocumentation("data-handling");

    expect(loaded).not.toBeNull();

    const sourcePath = loaded!.entry.sourcePaths[0] ?? "";
    const prepared = prepareHelpMarkdownForPresentation(loaded!.markdown, sourcePath, {
      helpTopicSlug: loaded!.entry.slug,
    });

    expect(
      dataHandlingTenantIsolationMarkdownIsCompliant(prepared, { sourcePath }),
      REMEDIATION,
    ).toBe(true);
    expect(prepared.toLowerCase()).toContain("three layers");
    expect(prepared.toLowerCase()).toContain("sql row-level security is not the production isolation boundary");
  });

  it("registry entry points at DATA_HANDLING.md (post TB-1656 SoT repair)", () => {
    const entry = getProductDocumentationEntry("data-handling");

    expect(entry?.sourcePaths[0]?.replace(/\\/g, "/")).toContain(
      DATA_HANDLING_TENANT_ISOLATION_CANONICAL_SOURCE_SUFFIX,
    );
    expect(entry?.sourcePaths.join("\n").toLowerCase()).not.toContain("tenant_isolation.md");
  });
});
