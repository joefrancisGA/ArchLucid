import { CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } from "@/lib/architecture-workflow-labels";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";
import { BUYER_EXECUTIVE_SUMMARY_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance-overview-copy";
import { describe, expect, it } from "vitest";

import { getRouteTitle } from "./route-titles";

describe("getRouteTitle — static routes", () => {
  it("returns known titles", () => {
    expect(getRouteTitle("/")).toBe("Overview");
    expect(getRouteTitle("/alerts")).toBe("Alerts");
    expect(getRouteTitle("/reviews/new")).toBe(START_REVIEW_LABEL);
    expect(getRouteTitle("/architectures/draft-1")).toBe(CREATE_ARCHITECTURE_LABEL);
    expect(getRouteTitle("/governance")).toBe(GOVERNANCE_OVERVIEW_PAGE_TITLE);
    expect(getRouteTitle("/signed-records")).toBe("Signed review records");
    expect(getRouteTitle(EXECUTIVE_DASHBOARD_HREF)).toBe(BUYER_EXECUTIVE_SUMMARY_VOCABULARY.pageTitle);
    expect(getRouteTitle("/executive/scorecard")).toBe(BUYER_EXECUTIVE_SUMMARY_VOCABULARY.scorecardPageTitle);
  });
});

describe("getRouteTitle — dynamic review detail", () => {
  it("returns Review detail for uuid path", () => {
    expect(getRouteTitle("/reviews/e2e-fixture-run-001")).toBe("Review detail");
  });
});

describe("getRouteTitle — manifest detail", () => {
  it("returns Signed review record", () => {
    expect(getRouteTitle("/signed-records/abc-123")).toBe("Signed review record");
  });
});

describe("getRouteTitle — governance policy pack detail", () => {
  it("returns Not found for leaked literal tokens in the path tail", () => {
    expect(getRouteTitle("/governance/policy-packs/undefined")).toBe("Not found");
    expect(getRouteTitle("/governance/policy-packs/null")).toBe("Not found");
  });

  it("returns Policy pack detail for normal ids", () => {
    expect(getRouteTitle("/governance/policy-packs/pack-1")).toBe("Policy pack detail");
  });
});

describe("getRouteTitle — unknown path", () => {
  it("capitalizes last segment", () => {
    expect(getRouteTitle("/foo/bar-baz")).toBe("Bar baz");
  });

  it("strips trailing slash", () => {
    expect(getRouteTitle("/planning/")).toBe("Improvement planning");
  });

  it("capitalizes ITSM acronym for itsm path segment", () => {
    expect(getRouteTitle("/admin/integrations/itsm")).toBe("ITSM connectors");
  });
});
