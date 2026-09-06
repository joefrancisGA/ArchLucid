import { beforeEach, describe, expect, it } from "vitest";

import { GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH, GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import {
  OPERATOR_RECENT_VIEWS_STORAGE_KEY,
  parseStoredRecentViews,
  recordRecentView,
  recentViewKindFromPathname,
  recentViewLabelFromPathname,
} from "@/lib/operator/operator-recent-views";

describe("operator-recent-views", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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
    expect(twice.schemaVersion).toBe(2);
  });

  it("CA-38: stores architecture identity recents with architectureId and desk href", () => {
    const next = recordRecentView(parseStoredRecentViews(null), {
      href: "/architecture/architectures/architecture-identity-001",
      label: "Payments platform",
      kind: "architecture",
      architectureId: "architecture-identity-001",
    });

    expect(next.entries[0]).toMatchObject({
      kind: "architecture",
      architectureId: "architecture-identity-001",
      href: "/architecture/architectures/architecture-identity-001",
    });
  });

  it("CA-38: drops draft-child identity hrefs from architecture recents", () => {
    const next = recordRecentView(parseStoredRecentViews(null), {
      href: "/architecture/architectures/architecture-identity-001?draft=draft-001",
      label: "Draft editor",
      kind: "architecture",
      architectureId: "architecture-identity-001",
    });

    expect(next.entries).toHaveLength(0);
  });

  it("maps assigned-to-me findings path to the sidebar label", () => {
    expect(recentViewLabelFromPathname(GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH)).toBe(
      OPERATOR_NAV_LINK_LABELS.assignedToMeFindings,
    );
  });

  it("maps pathname labels", () => {
    expect(recentViewLabelFromPathname("/")).toBeNull();
    expect(recentViewLabelFromPathname("/architecture/reviews/run-1")).toBe("Review");
    expect(recentViewLabelFromPathname("/architecture/architectures/architecture-identity-001")).toBe("Architecture");
    expect(recentViewLabelFromPathname("/audit")).toBe("Audit trail");
  });

  it("maps architecture identity routes to architecture kind", () => {
    expect(recentViewKindFromPathname("/architecture/architectures/architecture-identity-001")).toBe("architecture");
    expect(
      recentViewKindFromPathname(
        "/architecture/architectures/architecture-identity-001",
        "draft=draft-001",
      ),
    ).toBe("page");
  });

  it("maps canonical governance audit path to Audit trail label", () => {
    expect(recentViewLabelFromPathname(GOVERNANCE_AUDIT_PATH)).toBe("Audit trail");
  });

  it("migrates legacy v1 storage on read", () => {
    window.localStorage.setItem(
      "archlucid.operatorRecentViews.v1",
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          {
            href: "/architecture/architectures/architecture-identity-001",
            label: "Payments platform",
            kind: "page",
            visitedAtUtc: "2026-01-02T10:00:00.000Z",
          },
        ],
      }),
    );

    const migrated = parseStoredRecentViews(
      window.localStorage.getItem("archlucid.operatorRecentViews.v1"),
    );

    expect(migrated.entries[0]?.kind).toBe("architecture");
    expect(migrated.entries[0]?.architectureId).toBe("architecture-identity-001");
  });
});
