import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalizeLegacyOperatorRoutePath } from "@/lib/canonicalize-legacy-operator-route-path";
import { INTERNAL_RECOMMENDATION_LEARNING_PATH } from "@/lib/internal-ops-route-paths";
import { RECOMMENDATION_LEARNING_CANONICAL_PATH } from "@/types/recommendation-learning-operational";

const ORPHAN_RECOMMENDATION_LEARNING_APP_DIRS = [
  join(process.cwd(), "src", "app", "(operator)", "recommendation-learning"),
  join(process.cwd(), "src", "app", "(marketing)", "recommendation-learning"),
] as const;

const CANONICAL_OPS_PAGE = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "internal",
  "recommendation-learning",
  "page.tsx",
);

const CANONICAL_OPS_CLIENT = join(
  process.cwd(),
  "src",
  "app",
  "(operator)",
  "internal",
  "recommendation-learning",
  "_sections",
  "RecommendationLearningOpsPageClient.tsx",
);

describe("recommendation-learning single surface (TB-1787)", () => {
  it("keeps the canonical ops surface on /internal/recommendation-learning", () => {
    expect(RECOMMENDATION_LEARNING_CANONICAL_PATH).toBe("/internal/recommendation-learning");
    expect(INTERNAL_RECOMMENDATION_LEARNING_PATH).toBe(RECOMMENDATION_LEARNING_CANONICAL_PATH);
    expect(existsSync(CANONICAL_OPS_PAGE)).toBe(true);
    expect(existsSync(CANONICAL_OPS_CLIENT)).toBe(true);
  });

  it("does not ship the orphan polished Learning UI under recommendation-learning", () => {
    for (const appDir of ORPHAN_RECOMMENDATION_LEARNING_APP_DIRS) {
      expect(existsSync(join(appDir, "page.tsx"))).toBe(false);
      expect(existsSync(join(appDir, "layout.tsx"))).toBe(false);
      expect(
        existsSync(join(appDir, "_sections", "RecommendationLearningPageView.tsx")),
      ).toBe(false);
    }
  });

  it("canonicalizes legacy /internal-operations/recommendation-learning to the ops path", () => {
    expect(canonicalizeLegacyOperatorRoutePath("/internal-operations/recommendation-learning")).toBe(
      INTERNAL_RECOMMENDATION_LEARNING_PATH,
    );
  });
});
