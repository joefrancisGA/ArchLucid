import { describe, expect, it } from "vitest";

import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { buildReviewsHubSources } from "@/lib/reviews-hub-evidence-copy";

describe("reviews-hub-evidence-copy (SY-55)", () => {
  it("Working related-links parent the architectures portfolio, not Home", () => {
    const sources = buildReviewsHubSources(true);
    const parent = sources[0];

    expect(parent?.label).toBe(ARCHITECTURE_DRAFTS_LIST_LABEL);
    expect(parent?.href).toBe(ARCHITECTURES_LIST_PATH);
    expect(parent?.label.toLowerCase()).not.toBe("home");
  });

  it("Guided hub sources omit the portfolio parent row", () => {
    const sources = buildReviewsHubSources(false);

    expect(sources[0]?.label).toBe("Start a review");
  });
});
