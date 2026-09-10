import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TARGET_PATH =
  "src/app/(operator)/insights/compare-two-reviews/_sections/CompareLastRequestOutcomeDetails.tsx";

const MERGE_CORRUPTION_MARKERS: readonly string[] = [
  "<<<<<<<",
  "=======", // conflict middle marker (paired with <<<<<<< in real conflicts)
  ">>>>>>>",
  "her — se",
  "\u0000",
];

describe("CompareLastRequestOutcomeDetails merge-corruption guard", () => {
  it("keeps customer-facing copy free of conflict markers and known merge typos", () => {
    const source = readFileSync(join(process.cwd(), TARGET_PATH), "utf8");

    const violations = MERGE_CORRUPTION_MARKERS.filter((marker) => source.includes(marker));

    expect(violations).toEqual([]);
  });

  it("documents the summarize CTA without the corrupted her/se fragment", () => {
    const source = readFileSync(join(process.cwd(), TARGET_PATH), "utf8");

    expect(source).toMatch(/AI explanation is not included here — use/);
    expect(source).not.toMatch(/her — se/i);
  });
});
