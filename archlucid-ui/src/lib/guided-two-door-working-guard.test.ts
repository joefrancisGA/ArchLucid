import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(process.cwd(), "src");

describe("guided two-door working guard (AO-45)", () => {
  it("keeps the Guided job chooser component mounted on reviews/new", () => {
    const source = readFileSync(
      join(UI_ROOT, "app/(operator)/architecture/reviews/new/ReviewsNewJobChooserSection.tsx"),
      "utf8",
    );

    expect(source).toContain('data-testid="reviews-new-job-chooser-section"');
  });

  it("Working reviews/new without path redirects before the chooser mounts", () => {
    const source = readFileSync(
      join(UI_ROOT, "app/(operator)/architecture/reviews/new/ReviewsNewRouteBody.tsx"),
      "utf8",
    );

    expect(source).toContain("reviews-new-working-redirect");
    expect(source).toContain("ReviewsNewPathSwitcherDeferred");
    expect(source).not.toContain("ReviewsNewJobChooserSection");
  });

  it("Guided path switcher tests still assert the chooser is visible", () => {
    const source = readFileSync(
      join(UI_ROOT, "app/(operator)/architecture/reviews/new/ReviewsNewPathSwitcher.test.tsx"),
      "utf8",
    );

    expect(source).toContain("reviews-new-job-chooser-section");
    expect(source).toContain('getByTestId("reviews-new-job-chooser-section")');
  });
});
