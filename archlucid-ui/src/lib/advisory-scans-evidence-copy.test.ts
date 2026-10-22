import { describe, expect, it } from "vitest";

import { ADVISORY_SCANS_SCANS_HREF } from "@/lib/advisory-scans-route";
import {
  ADVISORY_SCANS_ORIENTATION_SOURCES,
  ADVISORY_SCANS_TAB_SOURCES,
} from "@/lib/advisory-scans-evidence-copy";

describe("advisory-scans-evidence-copy (ADT)", () => {
  it("excludes self-href to the scans tab from orientation Sources", () => {
    const orientationHrefs = ADVISORY_SCANS_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(ADVISORY_SCANS_SCANS_HREF);
    expect(ADVISORY_SCANS_ORIENTATION_SOURCES.length).toBeLessThan(ADVISORY_SCANS_TAB_SOURCES.length);
    expect(ADVISORY_SCANS_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
