import { describe, expect, it } from "vitest";

import { LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH } from "@/lib/legacy-architecture-graph-route";
import {
  MARKETING_ROBOTS_DISALLOW_PREFIXES,
  MARKETING_SITEMAP_PATHNAMES,
} from "@/lib/marketing/public-marketing-seo-paths";

describe("legacy-architecture-graph-route SEO inventory (TB-1807)", () => {
  it("does not promote /operate/architecture-graph in marketing sitemap inventory", () => {
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH);
    expect(MARKETING_SITEMAP_PATHNAMES).not.toContain(`${LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH}/`);
  });

  it("keeps /operate/architecture-graph in robots disallow prefixes after redirect shim removal", () => {
    expect(MARKETING_ROBOTS_DISALLOW_PREFIXES).toContain(LEGACY_OPERATE_ARCHITECTURE_GRAPH_PATH);
  });
});
