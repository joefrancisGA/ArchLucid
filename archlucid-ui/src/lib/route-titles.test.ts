import { CREATE_ARCHITECTURE_LABEL, START_REVIEW_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  SPONSOR_DASHBOARD_HREF,
  SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF,
} from "@/lib/sponsor/sponsor-dashboard-route";
import { BUYER_SPONSOR_SUMMARY_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-overview-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { describe, expect, it } from "vitest";

import { getRouteTitle } from "./route-titles";

describe("getRouteTitle — static routes", () => {
  it("returns known titles", () => {
    expect(getRouteTitle("/")).toBe("Home");
    expect(getRouteTitle(GOVERNANCE_AUDIT_PATH)).toBe(OPERATOR_NAV_LINK_LABELS.auditTrail);
    expect(getRouteTitle("/architecture/reviews/new")).toBe(START_REVIEW_LABEL);
    expect(getRouteTitle("/architectures/draft-1")).toBe(CREATE_ARCHITECTURE_LABEL);
    expect(getRouteTitle("/architecture/architectures/draft-1")).toBe(CREATE_ARCHITECTURE_LABEL);
    expect(getRouteTitle("/governance/approval-queue")).toBe(GOVERNANCE_OVERVIEW_PAGE_TITLE);
    expect(getRouteTitle(SIGNED_RECORDS_LIST_PATH)).toBe(OPERATOR_NAV_LINK_LABELS.signedReviewRecords);
    expect(getRouteTitle(SPONSOR_DASHBOARD_HREF)).toBe(BUYER_SPONSOR_SUMMARY_VOCABULARY.pageTitle);
    expect(getRouteTitle(SPONSOR_DASHBOARD_WORKSPACE_HEALTH_HREF)).toBe(
      OPERATOR_NAV_LINK_LABELS.workspaceHealth,
    );
    expect(getRouteTitle("/internal/validate-route")).toBe(OPERATOR_NAV_LINK_LABELS.replayReview);
    expect(getRouteTitle("/insights/ask-review-questions")).toBe("Ask review questions");
    expect(getRouteTitle("/insights/search-review-evidence")).toBe("Search review evidence");
  });
});

describe("getRouteTitle — dynamic review detail", () => {
  it("returns Review detail for uuid path", () => {
    expect(getRouteTitle("/architecture/reviews/e2e-fixture-run-001")).toBe("Review detail");
  });
});

describe("getRouteTitle — manifest detail", () => {
  it("returns Signed review record", () => {
    expect(getRouteTitle("/governance/signed-records/abc-123")).toBe("Signed review record");
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
    expect(getRouteTitle("/insights/improvement-planning/")).toBe("Improvement planning");
  });

  it("capitalizes ITSM acronym for itsm path segment", () => {
    expect(getRouteTitle("/internal/integrations/itsm")).toBe("ITSM connectors");
  });
});
