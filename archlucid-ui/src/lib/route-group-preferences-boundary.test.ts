import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest/Vite transforms import.meta.url to a virtual scheme in CI. The focused
// workflow runs with archlucid-ui as cwd, so read files from that root.
const src = join(process.cwd(), "src");
const read = (path: string) => readFileSync(join(src, path), "utf8");

describe("operator-only preference provider route boundary (RC49 first-load budget)", () => {
  it("excludes operator-only preference clients from the global marketing root", () => {
    const root = read("app/layout.tsx");
    expect(root).not.toContain("SampleReviewsOnOverviewPreferenceProvider");
    expect(root).not.toContain("WhereToGoNextPreferenceProvider");
    // These shared dependencies and the Working/Rehearsal context remain in place.
    expect(root).toContain("<WorkspaceModeProvider>");
    expect(root).toContain("<OperatorQueryProvider>");
    expect(root).toContain("<WorkingCareerRehearsalIntentProvider>");
  });

  it("retains the same ordered preference wrappers inside operator routes", () => {
    const layout = read("app/(operator)/layout.tsx");
    expect(layout).toMatch(
      /<WhereToGoNextPreferenceProvider>\s*<SampleReviewsOnOverviewPreferenceProvider>\s*<OperatorLayoutClient>/u,
    );
    expect(layout).toMatch(
      /<\/OperatorLayoutClient>\s*<\/SampleReviewsOnOverviewPreferenceProvider>\s*<\/WhereToGoNextPreferenceProvider>/u,
    );
  });

  it("retains fail-safe public-page defaults when no operator provider exists", () => {
    const whereNext = read("components/WhereToGoNextPreferenceProvider.tsx");
    const sample = read("components/SampleReviewsOnOverviewPreferenceProvider.tsx");
    expect(whereNext).toMatch(/if \(context === null\) \{\s*return DEFAULT_WHERE_TO_GO_NEXT_ENABLED;/u);
    expect(sample).toMatch(/if \(context === null\) \{\s*return DEFAULT_SAMPLE_REVIEWS_ON_OVERVIEW_ENABLED;/u);
  });
});
