import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH,
  ARCHITECTURE_INTELLIGENCE_HELP_ORIENTATION_SOURCES,
  ARCHITECTURE_INTELLIGENCE_HELP_SOURCES,
} from "@/lib/architecture-intelligence-help-evidence-copy";
import { ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH } from "@/lib/architecture/architecture-intelligence-evidence-copy";

describe("architecture-intelligence help evidence copy", () => {
  it("excludes help and workspace self-hrefs from orientation Sources", () => {
    const orientationHrefs = ARCHITECTURE_INTELLIGENCE_HELP_ORIENTATION_SOURCES.map((source) => source.href);

    expect(new Set(orientationHrefs).size).toBe(orientationHrefs.length);
    expect(orientationHrefs).not.toContain(ARCHITECTURE_INTELLIGENCE_HELP_CANONICAL_PATH);
    expect(orientationHrefs).not.toContain(ARCHITECTURE_INTELLIGENCE_CANONICAL_PATH);
    expect(ARCHITECTURE_INTELLIGENCE_HELP_ORIENTATION_SOURCES.every((source) => source.when !== undefined)).toBe(true);
  });
});
