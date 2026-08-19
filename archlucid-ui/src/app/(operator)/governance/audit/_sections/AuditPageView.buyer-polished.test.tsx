import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuditPageView } from "@/app/(operator)/governance/audit/_sections/AuditPageView";
import type { AuditPageViewProps } from "@/app/(operator)/governance/audit/_sections/audit-page-view-props";
import {
  AUDIT_TRAIL_PAGE_SUBTITLE,
  AUDIT_TRAIL_PAGE_SUBTITLE_BUYER,
  AUDIT_TRAIL_PRODUCT_SAFE_INTRO,
} from "@/lib/audit-trail-page-copy";
import {
  AUDIT_TRAIL_CLAIM_HEADING,
  AUDIT_TRAIL_FOLLOW_UPS_TITLE,
} from "@/lib/audit-trail-evidence-copy";
import {
  GOVERNANCE_AUDIT_PRIMARY_CONTENT_ID,
  GOVERNANCE_AUDIT_SKIP_LINK_LABEL,
} from "@/lib/governance-audit-page-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

vi.mock("@/components/LayerHeader", () => ({
  LayerHeader: () => null,
}));

vi.mock("@/components/cto-demo/CtoDemoAuditIntegrityExportButton", () => ({
  CtoDemoAuditIntegrityExportButton: () => null,
}));

vi.mock("@/components/cto-demo/CtoDemoAuditIntegrityVerifyButton", () => ({
  CtoDemoAuditIntegrityVerifyButton: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("./AuditSearchSection", () => ({
  AuditSearchSection: () => <div data-testid="audit-search-section" />,
}));

vi.mock("./AuditResultsSection", () => ({
  AuditResultsSection: () => <div data-testid="audit-results-section" />,
}));

function buildProps(overrides: Partial<AuditPageViewProps> = {}): AuditPageViewProps {
  return {
    buyerPolishedShell: true,
    viewMode: "story",
    onViewModeChange: vi.fn(),
    runId: "sample-review",
    buyerAuditTrailSummaryLine: null,
    buyerAuditTrailMetrics: null,
    displayEvents: [],
    callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
    exportRoleOk: true,
    failure: null,
    canMutateEnterpriseShell: true,
    advancedAuditFiltersOpen: false,
    setAdvancedAuditFiltersOpen: vi.fn(),
    buyerPrimaryFiltersOpen: false,
    setBuyerPrimaryFiltersOpen: vi.fn(),
    eventTypes: [],
    eventType: "",
    setEventType: vi.fn(),
    fromUtc: "",
    setFromUtc: vi.fn(),
    toUtc: "",
    setToUtc: vi.fn(),
    correlationId: "",
    setCorrelationId: vi.fn(),
    actorUserId: "",
    setActorUserId: vi.fn(),
    setRunId: vi.fn(),
    searching: false,
    lastRefreshedAt: null,
    loadingTypes: false,
    auditDatePreset: null,
    applyAuditDatePreset: vi.fn(async () => undefined),
    clearDateRangeAndSearch: vi.fn(async () => undefined),
    runSearch: vi.fn(async () => undefined),
    clearFiltersAndSearch: vi.fn(async () => undefined),
    events: [],
    displayEventGroups: null,
    hasMoreResults: false,
    loadingMore: false,
    uniformRunIdForDisplay: null,
    auditSearchEmptyLine: "No events",
    loadMore: vi.fn(async () => undefined),
    csvExportUiAllowed: true,
    exporting: false,
    exportDateRangeReady: true,
    onExportCsv: vi.fn(async () => undefined),
    getAuditSavedViewPayload: vi.fn(),
    loadAuditSavedView: vi.fn(async () => undefined),
    ctoDemoAuditFilterActive: false,
    onClearCtoDemoAuditFilter: vi.fn(),
    ...overrides,
  };
}

describe("AuditPageView buyer-polished shell", () => {
  it("renders skip link, breadcrumb, and orientation above the audit body", () => {
    render(<AuditPageView {...buildProps()} />);

    expect(screen.getByRole("link", { name: GOVERNANCE_AUDIT_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${GOVERNANCE_AUDIT_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("audit-page-breadcrumb")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: AUDIT_TRAIL_CLAIM_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: AUDIT_TRAIL_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("governance-audit-primary-content")).toBeInTheDocument();
    expect(screen.queryByTestId("audit-evidence-trail-vocabulary")).toBeNull();
  });

  it("uses buyer subtitle in the header without a duplicate intro paragraph", () => {
    render(<AuditPageView {...buildProps()} />);

    expect(screen.getByText(AUDIT_TRAIL_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(AUDIT_TRAIL_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("audit-header-refresh-button")).toBeInTheDocument();
    expect(screen.getByTestId("audit-last-refreshed")).toHaveTextContent(/Not refreshed yet/i);
    expect(screen.queryAllByText(AUDIT_TRAIL_PRODUCT_SAFE_INTRO).length).toBe(1);
  });
});
