import { describe, expect, it } from "vitest";

import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import {
  parseStoredRecentViews,
  recordRecentView,
  recentViewLabelFromPathname,
} from "@/lib/operator/operator-recent-views";

describe("operator-recent-views", () => {
  it("records and dedupes recent views", () => {
    const initial = parseStoredRecentViews(null);
    const once = recordRecentView(initial, {
      href: "/architecture/reviews/abc",
      label: "Review",
      kind: "review",
    });
    const twice = recordRecentView(once, {
      href: "/architecture/reviews/abc",
      label: "Review",
      kind: "review",
    });

    expect(twice.entries).toHaveLength(1);
    expect(twice.entries[0]?.href).toBe("/architecture/reviews/abc");
  });

  it("maps assigned-to-me findings path to the sidebar label", () => {
    expect(recentViewLabelFromPathname(GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH)).toBe(
      OPERATOR_NAV_LINK_LABELS.assignedToMeFindings,
    );
  });

  it("maps pathname labels", () => {
    expect(recentViewLabelFromPathname("/")).toBeNull();
    expect(recentViewLabelFromPathname("/architecture/reviews/run-1")).toBe("Review");
    expect(recentViewLabelFromPathname("/audit")).toBe("Audit trail");
  });

  it("maps canonical governance audit path to Audit trail label", () => {
    expect(recentViewLabelFromPathname(GOVERNANCE_AUDIT_PATH)).toBe("Audit trail");
  });
});
