import { describe, expect, it } from "vitest";

import {
  AZURE_PERMISSIONS_HELP_CANONICAL_PATH,
  AZURE_PERMISSIONS_HELP_ORIENTATION_SOURCES,
  AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION,
  AZURE_PERMISSIONS_HELP_SOURCES,
} from "@/lib/azure-permissions-help-evidence-copy";

describe("azure-permissions help evidence copy", () => {
  it("excludes help and setup self-hrefs from orientation Sources", () => {
    const orientationHrefs = AZURE_PERMISSIONS_HELP_ORIENTATION_SOURCES.map((source) => source.href);

    expect(new Set(orientationHrefs).size).toBe(orientationHrefs.length);
    expect(orientationHrefs).not.toContain(AZURE_PERMISSIONS_HELP_CANONICAL_PATH);
    expect(orientationHrefs).not.toContain(AZURE_PERMISSIONS_HELP_PRIMARY_SETUP_ACTION.defaultHref);
    expect(AZURE_PERMISSIONS_HELP_ORIENTATION_SOURCES.length).toBeLessThan(AZURE_PERMISSIONS_HELP_SOURCES.length);
  });
});
