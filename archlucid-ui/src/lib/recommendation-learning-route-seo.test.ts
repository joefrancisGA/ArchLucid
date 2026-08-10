import { describe, expect, it } from "vitest";

import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";
import { RECOMMENDATION_LEARNING_TRAFFIC_PATH } from "@/lib/ui-route-traffic-recommendation-learning";

describe("recommendation-learning-route SEO inventory (TB-1786)", () => {
  it("does not promote /internal/recommendation-learning in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(RECOMMENDATION_LEARNING_TRAFFIC_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${RECOMMENDATION_LEARNING_TRAFFIC_PATH}/`);
  });

  it("keeps /internal/recommendation-learning in robots disallow prefixes", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(`${RECOMMENDATION_LEARNING_TRAFFIC_PATH}/`);
  });
});
