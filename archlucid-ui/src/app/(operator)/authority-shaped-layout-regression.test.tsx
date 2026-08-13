/**
 * Page-level **authority-shaped layout** regression: ordering and visual hierarchy that should stay tied to
 * `useOperateCapability()` (Execute+ floor) and inspect-first patterns — not copy wording.
 *
 * **UI shaping only:** these assertions do not prove authorization; **ArchLucid.Api** `[Authorize]` remains
 * authoritative for POST/toggle. See **docs/PRODUCT_PACKAGING.md** §3 *Four UI shaping surfaces* and *Contributor drift guard*.
 *
 * Broader seam parity lives in `authority-seam-regression.test.ts`, `authority-execute-floor-regression.test.ts`,
 * `nav-shell-visibility.test.ts`, and `enterprise-authority-ui-shaping.test.tsx` (mutation → disabled/readOnly).
 * Rank-gated **note** lines live in `EnterpriseControlsContextHints.authority.test.tsx`.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buyerPolishedShellVitestOverride,
  extendBuyerPolishedShellVitestMock,
} from "@/testing/buyer-polished-shell-vitest-override";

const mutateCapability = vi.hoisted(() => ({ current: false }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) =>
  extendBuyerPolishedShellVitestMock(importOriginal),
);

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: (): boolean => mutateCapability.current,
}));

// Pages migrated to `useNavSurface()` resolve `mutationCapability` through
// the composed hook; mock it so the same `mutateCapability.current` ref
// drives every page in this suite.
vi.mock("@/lib/use-nav-surface", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/use-nav-surface")>();

  return {
    ...mod,
    useNavSurface: (routeKey: import("@/lib/layer-guidance").LayerGuidancePageKey) => {
      const real = mod.composeNavSurface(routeKey, 0, false, false, true);

      return { ...real, mutationCapability: mutateCapability.current };
    },
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  usePathname: (): string => "/alerts",
  useRouter: (): { push: () => void; replace: () => void } => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

const apiHoisted = vi.hoisted(() => ({
  listPolicyPacks: vi.fn(),
  getEffectivePolicyPacks: vi.fn(),
  getEffectivePolicyContent: vi.fn(),
  listPolicyPackVersions: vi.fn(),
  listAlertsPaged: vi.fn(),
  listAlertsCursor: vi.fn(),
  listApprovalRequests: vi.fn(),
  listPromotions: vi.fn(),
  listActivations: vi.fn(),
  listAlertRoutingSubscriptions: vi.fn(),
  getGovernanceDashboard: vi.fn(),
  getGovernanceDecisionsNeededSummary: vi.fn(),
  listRunsByProjectPaged: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...mod,
    listPolicyPacks: apiHoisted.listPolicyPacks,
    getEffectivePolicyPacks: apiHoisted.getEffectivePolicyPacks,
    getEffectivePolicyContent: apiHoisted.getEffectivePolicyContent,
    listPolicyPackVersions: apiHoisted.listPolicyPackVersions,
    listAlertsPaged: apiHoisted.listAlertsPaged,
    listAlertsCursor: apiHoisted.listAlertsCursor,
    listApprovalRequests: apiHoisted.listApprovalRequests,
    listPromotions: apiHoisted.listPromotions,
    listActivations: apiHoisted.listActivations,
    listAlertRoutingSubscriptions: apiHoisted.listAlertRoutingSubscriptions,
    getGovernanceDashboard: apiHoisted.getGovernanceDashboard,
    getGovernanceDecisionsNeededSummary: apiHoisted.getGovernanceDecisionsNeededSummary,
    listRunsByProjectPaged: apiHoisted.listRunsByProjectPaged,
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
  }: {
    href: string;
    children: import("react").ReactNode;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("./governance/_sections/governance-workflow-deferred-chunks", async () => {
  const { buildGovernanceWorkflowDeferredChunksVitestMock } = await import(
    "@/testing/governance-workflow-deferred-chunks-vitest-mock"
  );

  return await buildGovernanceWorkflowDeferredChunksVitestMock();
});

vi.mock("./governance/policy-packs/_sections/load-policy-packs-page-data", () => ({
  loadPolicyPacksPageData: () =>
    Promise.resolve({
      packs: [],
      effective: { tenantId: "", workspaceId: "", projectId: "", packs: [] },
      effectiveContent: {
        complianceRuleIds: [],
        complianceRuleKeys: [],
        alertRuleIds: [],
        compositeAlertRuleIds: [],
        advisoryDefaults: {},
        metadata: {},
      },
      failure: null,
    }),
}));

import { AlertRoutingContent } from "@/components/alerts/AlertRoutingContent";
import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";
import GovernanceWorkflowPage from "./governance/approval-queue/page";
import PolicyPacksPage from "./governance/policy-packs/page";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance/governance-overview-copy";

const sampleAlert = {
  alertId: "alert-layout-1",
  ruleId: "rule-1",
  title: "Layout fixture alert",
  category: "Test",
  severity: "High",
  status: "Open",
  triggerValue: "n/a",
  description: "Synthetic row for layout regression.",
  createdUtc: new Date().toISOString(),
};

describe("authority-shaped layout regression", () => {
  beforeEach(() => {
    buyerPolishedShellVitestOverride.value = false;
    mutateCapability.current = false;
    apiHoisted.listPolicyPacks.mockResolvedValue([]);
    apiHoisted.getEffectivePolicyPacks.mockResolvedValue({
      tenantId: "",
      workspaceId: "",
      projectId: "",
      packs: [],
    });
    apiHoisted.getEffectivePolicyContent.mockResolvedValue({
      complianceRuleIds: [],
      complianceRuleKeys: [],
      alertRuleIds: [],
      compositeAlertRuleIds: [],
      advisoryDefaults: {},
      metadata: {},
    });
    apiHoisted.listPolicyPackVersions.mockResolvedValue([]);
    apiHoisted.listAlertsPaged.mockResolvedValue({ items: [sampleAlert], totalCount: 1 });
    apiHoisted.listAlertsCursor.mockResolvedValue({
      items: [sampleAlert],
      nextCursor: null,
      hasMore: false,
      requestedTake: 25,
    });
    apiHoisted.listApprovalRequests.mockResolvedValue([]);
    apiHoisted.listPromotions.mockResolvedValue([]);
    apiHoisted.listActivations.mockResolvedValue([]);
    apiHoisted.getGovernanceDashboard.mockResolvedValue({
      pendingApprovals: [],
      recentDecisions: [],
      recentChanges: [],
      pendingCount: 0,
    });
    apiHoisted.getGovernanceDecisionsNeededSummary.mockResolvedValue({
      pendingApprovals: 0,
      staleRisks: 0,
      unownedHighSeverityRisks: 0,
      findingsAwaitingEvidence: 0,
      waiversExpiringWithin14Days: 0,
      deferredFindingsDue: 0,
      totalDecisionItems: 0,
    });
    apiHoisted.listRunsByProjectPaged.mockResolvedValue({
      items: [{ runId: "gov-layout-run", projectId: "default", description: "Layout fixture", createdUtc: "" }],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
    apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([
      {
        routingSubscriptionId: "rs-layout-1",
        tenantId: "t",
        workspaceId: "w",
        projectId: "p",
        name: "Layout fixture subscription",
        channelType: "Email",
        destination: "ops@example.test",
        minimumSeverity: "High",
        isEnabled: true,
        createdUtc: new Date().toISOString(),
        metadataJson: "{}",
      },
    ]);
  });

  /**
   * Reader / non-mutating shell: submit card moves after inspect sections so "Load a run" is not buried under writes.
   * Regression: dropping `flex-col-reverse` would equal-weight submit vs inspect again.
   */
  it("Governance workflow: inspect-first column order when mutation capability is false", async () => {
    mutateCapability.current = false;
    const { container } = render(<GovernanceWorkflowPage />);

    // Dynamic chunk can lag under parallel Vitest workers (same timeout as operate-authority shaping).
    await waitFor(
      () => {
        expect(screen.getByRole("heading", { name: GOVERNANCE_OVERVIEW_PAGE_TITLE })).toBeInTheDocument();
      },
      { timeout: 8000 },
    );

    // The overview panel (review picker) is its own dynamic chunk, so wait for the control itself.
    await waitFor(
      () => {
        expect(screen.getByLabelText("Review")).toBeInTheDocument();
      },
      { timeout: 8000 },
    );

    fireEvent.change(screen.getByLabelText("Review"), { target: { value: "gov-layout-run" } });
    fireEvent.click(screen.getByTestId("governance-overview-load-review"));

    await waitFor(
      () => {
        const stack = container.querySelector("[data-testid='governance-workflow-review-context-stack']");

        expect(stack).not.toBeNull();
        expect(stack?.className).toContain("flex-col-reverse");
      },
      { timeout: 8000 },
    );
  });

  /** Same inspect-first contract as workflow: current packs + JSON before lifecycle when reads cannot mutate. */
  it("Policy packs: inspect-first column order when mutation capability is false", async () => {
    mutateCapability.current = false;
    const page = await PolicyPacksPage();
    const { container } = render(page);

    await waitFor(() => {
      expect(container.querySelector(".flex.flex-col-reverse")).not.toBeNull();
    });
  });

  /**
   * Triage strip is slightly deemphasized when Confirm/write is off — keeps triage visible without implying parity with
   * operator write affordances. Regression: removing `opacity-90` loses the hierarchy cue.
   */
  it("Alerts inbox: triage section deemphasized when mutation capability is false", async () => {
    mutateCapability.current = false;
    render(<AlertsInboxContent />);

    await waitFor(() => {
      expect(screen.getByRole("article")).toBeInTheDocument();
    });

    const triage = screen.getByRole("region", { name: "Triage actions" });

    expect(triage).toHaveClass("opacity-90");
  });

  /**
   * Inspect (delivery history) before configure-adjacent toggle — read-tier users see the safe action first.
   * Ordering is structural (button labels), not tooltip prose.
   */
  it("Alert routing: delivery inspect button precedes enable/disable on a subscription row", async () => {
    mutateCapability.current = true;
    render(<AlertRoutingContent />);

    await waitFor(() => {
      expect(screen.getByText("Layout fixture subscription")).toBeInTheDocument();
    });

    const card = screen.getByText("Layout fixture subscription").closest("div");

    expect(card).not.toBeNull();

    const buttons = within(card as HTMLElement).getAllByRole("button");
    const labels = buttons.map((b) => b.textContent?.trim() ?? "");

    const inspectIdx = labels.findIndex((t) => t.includes("Delivery history"));
    const toggleIdx = labels.findIndex((t) => t === "Disable" || t === "Enable");

    expect(inspectIdx).toBeGreaterThanOrEqual(0);
    expect(toggleIdx).toBeGreaterThanOrEqual(0);
    expect(inspectIdx).toBeLessThan(toggleIdx);
  });
});
