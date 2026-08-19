import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const sectionSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "RunDetailPackageChangesSinceFinalizeSection.tsx"),
  "utf8",
);

describe("RunDetailPackageChangesSinceFinalizeSection", () => {
  it("reuses cached preloaded pipeline timeline instead of client timelines-bundle fetch", () => {
    expect(sectionSource).toContain("loadRunDetailPipelineTimelineCached");
    expect(sectionSource).not.toContain('"use client"');
    expect(sectionSource).not.toContain("fetchRunDetailTimelinesBundle");
    expect(sectionSource).not.toContain("useEffect");
  });
});
