/**
 * Page-level regression: **`useOperateCapability()`** must actually gate Operate write affordances. Lib-level parity lives in
 * **`authority-seam-regression.test.ts`** / **`current-principal.test.ts`**; this file catches inverted `disabled` props,
 * dropped hooks, or pages that stop calling the hook while nav still filters by rank.
 *
 * Governance workflow: submit card uses the same hook for read-only fields (`readOnly` / disabled selects) — asserted
 * via DOM attributes, not tooltip copy strings.
 *
 * Policy resolution: **`Refresh policy resolution`** reader supplement is driven only by the mutation capability hook
 * (Refresh stays enabled); rank cues on the same page use **`useNavCallerAuthorityRank`** in production — here the
 * mocked hook isolates the write-boundary copy from **`GovernanceResolutionRankCue`**.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

vi.mock("@/components/OperatorNavAuthorityProvider", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/components/OperatorNavAuthorityProvider")>();
  const { AUTHORITY_RANK } = await import("@/lib/nav-authority");

  return {
    ...mod,
    useNavCallerAuthorityRank: (): number =>
      mutateCapability.current ? AUTHORITY_RANK.ExecuteAuthority : AUTHORITY_RANK.ReadAuthority,
  };
});

// Pages that have migrated to `useNavSurface()` (Prompt 7 / `use-nav-surface.ts`)
// resolve `mutationCapability` through the composed hook. Mock it here so the
// same `mutateCapability.current` ref still drives every page in this suite.
vi.mock("@/lib/use-nav-surface", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/use-nav-surface")>();
  const { AUTHORITY_RANK } = await import("@/lib/nav-authority");

  return {
    ...mod,
    useNavSurface: (routeKey: import("@/lib/layer-guidance").LayerGuidancePageKey) => {
      const callerRank = mutateCapability.current ? AUTHORITY_RANK.ExecuteAuthority : AUTHORITY_RANK.ReadAuthority;
      const real = mod.composeNavSurface(routeKey, callerRank, false, false, true);

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
  listAlertRules: vi.fn(),
  listAlertRoutingSubscriptions: vi.fn(),
  listCompositeAlertRules: vi.fn(),
  listApprovalRequests: vi.fn(),
  listPromotions: vi.fn(),
  listActivations: vi.fn(),
  getGovernanceResolution: vi.fn(),
  listDigestSubscriptions: vi.fn(),
  listAdvisorySchedules: vi.fn(),
  listRunsByProjectPaged: vi.fn(),
  simulateAlertRule: vi.fn(),
  getGovernanceDashboard: vi.fn(),
  getGovernanceDecisionsNeededSummary: vi.fn(),
}));

/**
 * Policy packs hides the lifecycle / create panel when demo static payloads are enabled
 * ({@link isStaticDemoPayloadFallbackEnabled}); CI sometimes sets demo env vars globally.
 * This suite asserts mutation gates on real controls, so keep demo-style suppression off here.
 */
vi.mock("@/lib/operator-static-demo", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/operator-static-demo")>();

  return {
    ...mod,
    isStaticDemoPayloadFallbackEnabled: (): boolean => false,
  };
});

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
    listAlertRules: apiHoisted.listAlertRules,
    listAlertRoutingSubscriptions: apiHoisted.listAlertRoutingSubscriptions,
    listCompositeAlertRules: apiHoisted.listCompositeAlertRules,
    listApprovalRequests: apiHoisted.listApprovalRequests,
    listPromotions: apiHoisted.listPromotions,
    listActivations: apiHoisted.listActivations,
    getGovernanceResolution: apiHoisted.getGovernanceResolution,
    listDigestSubscriptions: apiHoisted.listDigestSubscriptions,
    listAdvisorySchedules: apiHoisted.listAdvisorySchedules,
    listRunsByProjectPaged: apiHoisted.listRunsByProjectPaged,
    simulateAlertRule: apiHoisted.simulateAlertRule,
    getGovernanceDashboard: apiHoisted.getGovernanceDashboard,
    getGovernanceDecisionsNeededSummary: apiHoisted.getGovernanceDecisionsNeededSummary,
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

import {
  alertSimulationCurrentBehaviorHeadingReader,
  alertTuningCurrentTuningHeadingReader,
  alertsInboxRefreshButtonTitleReader,
  alertsInboxRankReaderLine,
  alertsTriageDialogConfirmButtonLabelReaderRank,
  governanceResolutionChangeRelatedControlsReaderSupplement,
  governanceResolutionEffectivePolicyHeadingReader,
  governanceResolutionRawOutputAccordionLabel,
  governanceResolutionResolutionDetailsHeadingReader,
  advisorySchedulesCreateScheduleButtonLabelReaderRank,
  compositeRulesCreateButtonLabelReaderRank,
  digestSubscriptionsCreateSubscriptionButtonLabelReaderRank,
  policyPacksCreatePackButtonLabelReaderRank,
  policyPacksCurrentPacksHeadingOperator,
  policyPacksCurrentPacksHeadingReader,
  policyPacksPackContentHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import { GOVERNANCE_OVERVIEW_PAGE_TITLE } from "@/lib/governance-overview-copy";

import { AlertRulesContent } from "@/components/alerts/AlertRulesContent";
import { AlertSimulationContent } from "@/components/alerts/AlertSimulationContent";
import { AlertTuningContent } from "@/components/alerts/AlertTuningContent";
import { AlertsInboxContent } from "@/components/alerts/AlertsInboxContent";
import { CompositeAlertRulesContent } from "@/components/alerts/CompositeAlertRulesContent";

import { AdvisorySchedulesContent } from "@/components/advisory/AdvisorySchedulesContent";
import { DigestSubscriptionsContent } from "@/components/digests/DigestSubscriptionsContent";
import { renderWithOperatorQuery } from "@/testing/operator-query-test-helpers";
import GovernanceResolutionPage from "./governance/standards-and-rules/page";
import { GovernanceWorkflowPageContent } from "./governance/_sections/GovernanceWorkflowPageContent";
import PolicyPacksPage from "./governance/policy-packs/page";

const emptyGovernanceResolutionPayload = {
  tenantId: "t-ui-shape",
  workspaceId: "w-ui-shape",
  projectId: "p-ui-shape",
  effectiveContent: {
    complianceRuleIds: [] as string[],
    complianceRuleKeys: [] as string[],
    alertRuleIds: [] as string[],
    compositeAlertRuleIds: [] as string[],
    advisoryDefaults: {} as Record<string, string>,
    metadata: {} as Record<string, string>,
  },
  decisions: [] as { itemType: string; itemKey: string }[],
  conflicts: [] as { itemType: string; itemKey: string }[],
  notes: [] as string[],
};

const sampleAlert = {
  alertId: "alert-ui-shape-1",
  ruleId: "rule-1",
  title: "Sample signal",
  category: "Test",
  severity: "High",
  status: "Open",
  triggerValue: "n/a",
  description: "Synthetic row for mutation gate tests.",
  createdUtc: new Date().toISOString(),
};

describe("Enterprise authority UI shaping (mutation hook → controls)", () => {
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
    apiHoisted.listAlertRules.mockResolvedValue([]);
    apiHoisted.listAlertRoutingSubscriptions.mockResolvedValue([]);
    apiHoisted.listCompositeAlertRules.mockResolvedValue([]);
    apiHoisted.listApprovalRequests.mockResolvedValue([]);
    apiHoisted.listPromotions.mockResolvedValue([]);
    apiHoisted.listActivations.mockResolvedValue([]);
    apiHoisted.getGovernanceResolution.mockResolvedValue(emptyGovernanceResolutionPayload);
    apiHoisted.listDigestSubscriptions.mockResolvedValue([]);
    apiHoisted.listAdvisorySchedules.mockResolvedValue([]);
    apiHoisted.listRunsByProjectPaged.mockResolvedValue({
      items: [{ runId: "gov-ui-shape-run", projectId: "default", description: "UI shape fixture", createdUtc: "" }],
      totalCount: 1,
      page: 1,
      pageSize: 50,
      hasMore: false,
    });
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
    apiHoisted.simulateAlertRule.mockResolvedValue({
      ruleKind: "Simple",
      simulatedUtc: "2026-01-01T00:00:00Z",
      evaluatedRunCount: 2,
      matchedCount: 1,
      wouldCreateCount: 1,
      wouldSuppressCount: 0,
      summaryNotes: [] as string[],
      outcomes: [] as import("@/types/alert-simulation").SimulatedAlertOutcome[],
    });
  });

  /**
   * Rule authoring lives in the Authoring and generation tools accordion; inspect/lifecycle JSON stays in
   * {@link AdvancedOptionsAccordion} labeled Inspect tools and JSON lifecycle.
   */
  async function expandPolicyPacksAuthoringTools(): Promise<void> {
    const toggle = screen.getByRole("button", { name: /^Authoring and generation tools$/ });

    fireEvent.click(toggle);

    await waitFor(
      () => {
        expect(toggle).toHaveAttribute("aria-expanded", "true");
      },
      { timeout: 8000 },
    );
  }

  async function expandPolicyPacksAdvancedOptions(): Promise<void> {
    const toggle = screen.getByRole("button", { name: /^Inspect tools and JSON lifecycle$/ });

    fireEvent.click(toggle);

    await waitFor(
      () => {
        expect(toggle).toHaveAttribute("aria-expanded", "true");
      },
      { timeout: 8000 },
    );
  }

  it(
    "Policy packs: Author rules tab surfaces the rule authoring wizard",
    async () => {
      mutateCapability.current = true;
      const page = await PolicyPacksPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^Authoring and generation tools$/ })).toBeInTheDocument();
      });

      await expandPolicyPacksAuthoringTools();
      fireEvent.click(screen.getByTestId("policy-packs-tab-author"));

      await waitFor(() => {
        expect(screen.getByTestId("policy-packs-author-tab")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId("policy-rule-authoring-wizard")).toBeInTheDocument();
      });
    },
    15_000,
  );

  it(
    "Policy packs: Create pack stays disabled when mutation capability is false",
    async () => {
      mutateCapability.current = false;
      const page = await PolicyPacksPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: policyPacksCurrentPacksHeadingReader })).toBeInTheDocument();
      });

      await expandPolicyPacksAdvancedOptions();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: policyPacksCreatePackButtonLabelReaderRank })).toBeDisabled();
      });
    },
    15_000,
  );

  it(
    "Policy packs: inventory headings show inspect framing when mutation capability is false",
    async () => {
      mutateCapability.current = false;
      const page = await PolicyPacksPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: policyPacksCurrentPacksHeadingReader })).toBeInTheDocument();
      });

      await expandPolicyPacksAdvancedOptions();

      expect(screen.getByRole("heading", { name: policyPacksPackContentHeadingReader })).toBeInTheDocument();
    },
    15_000,
  );

  it(
    "Policy packs: Create pack enables after load when mutation capability is true",
    async () => {
      mutateCapability.current = true;
      const page = await PolicyPacksPage();
      render(page);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: policyPacksCurrentPacksHeadingOperator })).toBeInTheDocument();
      });

      await expandPolicyPacksAdvancedOptions();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /create pack/i })).not.toBeDisabled();
      });
    },
    15_000,
  );

  it("Alerts inbox: triage preview opens but Confirm stays disabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    render(<AlertsInboxContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Acknowledge/ })).not.toBeDisabled();
    });

    expect(screen.getByRole("button", { name: /^Refresh$/ })).toHaveAttribute("title", alertsInboxRefreshButtonTitleReader);

    screen.getByRole("button", { name: /Acknowledge/ }).click();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: alertsTriageDialogConfirmButtonLabelReaderRank })).toBeDisabled();
    });
  });

  it("Alerts inbox: triage Acknowledge enables after load when mutation capability is true", async () => {
    mutateCapability.current = true;
    render(<AlertsInboxContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Acknowledge$/ })).not.toBeDisabled();
    });
  });

  /**
   * **Visibility** vs **Capability:** **`AlertsInboxRankCue`** renders at read tier so the inbox keeps a single
   * `role="note"` write-boundary strip. Governance context now lives on the alerts hub header instead of LayerHeader.
   */
  it("Alerts inbox: shows inbox rank cue note when mutation capability is false", async () => {
    mutateCapability.current = false;
    render(<AlertsInboxContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Acknowledge/ })).toBeInTheDocument();
    });

    expect(screen.getByText(alertsInboxRankReaderLine)).toBeInTheDocument();
    expect(screen.queryByTestId("layer-header-operate-execute-rank-cue")).toBeNull();
  });

  it("Alerts inbox: omits inbox rank cue when mutation capability is true", async () => {
    mutateCapability.current = true;
    render(<AlertsInboxContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Acknowledge$/ })).not.toBeDisabled();
    });

    expect(screen.queryByTestId("layer-header-operate-execute-rank-cue")).toBeNull();
    expect(screen.queryByText(alertsInboxRankReaderLine)).toBeNull();
  });

  it("Digest subscriptions: Create subscription stays disabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    renderWithOperatorQuery(<DigestSubscriptionsContent healthSnap={null} />);

    await waitFor(() => {
      expect(apiHoisted.listDigestSubscriptions).toHaveBeenCalled();
    });

    expect(
      screen.getByRole("button", { name: digestSubscriptionsCreateSubscriptionButtonLabelReaderRank }),
    ).toBeDisabled();
  });

  it("Advisory schedules: Create schedule submit stays disabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    render(<AdvisorySchedulesContent />);

    await waitFor(() => {
      expect(apiHoisted.listAdvisorySchedules).toHaveBeenCalled();
    });

    expect(
      screen.getByRole("button", { name: advisorySchedulesCreateScheduleButtonLabelReaderRank }),
    ).toBeDisabled();
  });

  it("Alert tuning: Current tuning heading uses inspect framing when mutation capability is false", () => {
    mutateCapability.current = false;
    render(<AlertTuningContent />);

    expect(screen.getByRole("heading", { name: alertTuningCurrentTuningHeadingReader })).toBeInTheDocument();
  });

  it("Alert simulation: Current behavior heading uses inspect framing when mutation capability is false", () => {
    mutateCapability.current = false;
    render(<AlertSimulationContent />);

    expect(
      screen.getAllByRole("heading", { name: alertSimulationCurrentBehaviorHeadingReader }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("Alert rules: Create rule stays disabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Create rule \(Execute\+\)/ })).toBeDisabled();
    });
  });

  it("Alert rules: Create rule enables after load when mutation capability is true", async () => {
    mutateCapability.current = true;
    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create rule" })).not.toBeDisabled();
    });
  });

  const sampleListedRule: import("@/types/alerts").AlertRule = {
    ruleId: "r-ui-simulate",
    tenantId: "t-ui-shape",
    workspaceId: "w-ui-shape",
    projectId: "p-ui-shape",
    name: "Simulate-able rule",
    ruleType: "CriticalRecommendationCount",
    severity: "Warning",
    thresholdValue: 2,
    isEnabled: true,
    targetChannelType: "DigestOnly",
    metadataJson: "{}",
    createdUtc: "2024-01-01T00:00:00Z",
  };

  it("Alert rules: Simulate runs POST simulation and headlines when alerts would fire", async () => {
    mutateCapability.current = true;
    apiHoisted.listAlertRules.mockResolvedValue([sampleListedRule]);

    render(<AlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Test rule Simulate-able rule/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Test rule Simulate-able rule/ }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Simulate: Simulate-able rule/ })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("alert-rule-simulate-run"));

    await waitFor(() => {
      expect(apiHoisted.simulateAlertRule).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("alert-rule-simulate-verdict")).toHaveTextContent("Alert would fire");

      const arg = apiHoisted.simulateAlertRule.mock.calls[0]![0] as Record<string, unknown>;

      expect(arg.ruleKind).toBe("Simple");

      expect(arg.simpleRule).toMatchObject({ ruleId: "r-ui-simulate", thresholdValue: 2 });
    });
  });

  it("Composite alert rules: Create composite rule stays disabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    render(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: compositeRulesCreateButtonLabelReaderRank })).toBeDisabled();
    });
  });

  it("Composite alert rules: Create composite rule enables after load when mutation capability is true", async () => {
    mutateCapability.current = true;
    render(<CompositeAlertRulesContent />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create composite rule" })).not.toBeDisabled();
    });
  });

  it(
    "Governance workflow: submit Review ID and manifest inputs stay read-only when mutation capability is false",
    async () => {
      mutateCapability.current = false;
      render(<GovernanceWorkflowPageContent />);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: GOVERNANCE_OVERVIEW_PAGE_TITLE })).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText("Review"), { target: { value: "gov-ui-shape-run" } });
      fireEvent.click(screen.getByTestId("governance-overview-load-review"));

      await waitFor(() => {
        expect(screen.getByTestId("governance-review-context-bar")).toBeInTheDocument();
      });

      expect(screen.getByText("No approval requests for this review")).toBeInTheDocument();
      expect(screen.getAllByText("Submit for governance approval").length).toBeGreaterThan(0);

      const submitVersion = document.getElementById("gov-submit-version") as HTMLInputElement | null;

      expect(submitVersion).not.toBeNull();
      expect(submitVersion!.readOnly).toBe(true);
    },
    15_000,
  );

  it("Governance workflow: submit Review ID is editable when mutation capability is true", async () => {
    mutateCapability.current = true;
    render(<GovernanceWorkflowPageContent />);

    await waitFor(() => {
      expect(screen.getByLabelText("Review")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Review"), { target: { value: "gov-ui-shape-run" } });
    fireEvent.click(screen.getByTestId("governance-overview-load-review"));

    await waitFor(() => {
      const submitVersion = document.getElementById("gov-submit-version") as HTMLInputElement | null;

      expect(submitVersion).not.toBeNull();
      expect(submitVersion!.readOnly).toBe(false);
    });

    expect(document.getElementById("gov-submit-run-select")).not.toBeNull();
  });

  /**
   * Rank cues (`GovernanceResolutionRankCue`) and this supplement are different seams: outside **`OperatorNavAuthorityProvider`**
   * tests default to Admin rank, but the mutation hook mock can still be **false** — we assert the page wires **soft-disable**
   * copy to **`useOperateCapability`**, not nav rank alone.
   */
  it("Policy resolution: refresh section shows reader supplement when mutation capability is false", async () => {
    mutateCapability.current = false;
    const page = await GovernanceResolutionPage();
    render(page);

    await waitFor(() => {
      expect(apiHoisted.getGovernanceResolution).toHaveBeenCalled();
    });

    expect(screen.getByText(governanceResolutionChangeRelatedControlsReaderSupplement)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: governanceResolutionEffectivePolicyHeadingReader })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: governanceResolutionResolutionDetailsHeadingReader }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: governanceResolutionRawOutputAccordionLabel })).toBeInTheDocument();
  });

  it("Policy resolution: refresh section omits reader supplement when mutation capability is true", async () => {
    mutateCapability.current = true;
    const page = await GovernanceResolutionPage();
    render(page);

    await waitFor(() => {
      expect(apiHoisted.getGovernanceResolution).toHaveBeenCalled();
    });

    expect(screen.queryByText(governanceResolutionChangeRelatedControlsReaderSupplement)).toBeNull();
  });

  /** Readers refresh effective policy; **`disabled`** must stay tied to **`loading`**, not mutation rank. */
  it("Policy resolution: Refresh stays enabled when mutation capability is false", async () => {
    mutateCapability.current = false;
    const page = await GovernanceResolutionPage();
    render(page);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Refresh" })).not.toBeDisabled();
  });
});
