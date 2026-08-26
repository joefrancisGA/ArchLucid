import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { PolicyPacksPageView } from "./PolicyPacksPageView";
import type { PolicyPacksPageViewModel } from "./policy-packs-page-view-model";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import {
  BUYER_POLICY_PACKS_PAGE_SUBTITLE,
} from "@/lib/policy/policy-packs-page";
import { POLICY_PACKS_HUB_CLAIM_DISCIPLINE } from "@/lib/policy/policy-packs-hub-evidence-copy";
import type { EffectivePolicyPackSet, PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";

const selectedPack: PolicyPack = {
  policyPackId: "demo-enterprise-privacy-pack",
  tenantId: "demo-tenant",
  workspaceId: "demo-workspace",
  projectId: "default",
  name: policyPackBuyerLabel("healthcare-claims-v3", "3.4.1"),
  description: "Healthcare Claims pack",
  packType: "BuiltIn",
  distributionScope: "Platform",
  status: "Active",
  createdUtc: "2026-01-10T12:00:00.000Z",
  currentVersion: "3.4.1",
};

const effective: EffectivePolicyPackSet = {
  tenantId: "demo-tenant",
  workspaceId: "demo-workspace",
  projectId: "default",
  packs: [
    {
      policyPackId: selectedPack.policyPackId,
      name: selectedPack.name,
      version: "3.4.1",
      packType: "BuiltIn",
      contentJson: "{}",
    },
  ],
};

const effectiveContent: PolicyPackContentDocument = {
  complianceRuleIds: [],
  complianceRuleKeys: ["phi.minimization.intake"],
  alertRuleIds: [],
  compositeAlertRuleIds: [],
  advisoryDefaults: {},
  metadata: { ruleSetId: "healthcare-claims-v3" },
};

function buildModel(overrides: Partial<PolicyPacksPageViewModel> = {}): PolicyPacksPageViewModel {
  return {
    canMutatePacks: false,
    buyerPolishedShell: true,
    pageTab: "my-packs",
    setPageTab: vi.fn(),
    catalogItems: [],
    catalogLoading: false,
    catalogFailure: null,
    selectedCatalogEntryId: "",
    setSelectedCatalogEntryId: vi.fn(),
    refreshCatalog: vi.fn(async () => undefined),
    onCloneCatalogEntry: vi.fn(async () => undefined),
    workspaceSelectionItems: [],
    workspaceSelectionLoading: false,
    togglingAssignmentId: null,
    onToggleWorkspaceSelection: vi.fn(async () => undefined),
    packs: [selectedPack],
    effective,
    effectiveContent,
    loading: false,
    lastRefreshedAt: new Date("2026-07-09T12:00:00.000Z"),
    failure: null,
    publishSuccessMessage: null,
    setPublishSuccessMessage: vi.fn(),
    name: "",
    setName: vi.fn(),
    description: "",
    setDescription: vi.fn(),
    packType: "",
    setPackType: vi.fn(),
    createJson: "{}",
    setCreateJson: vi.fn(),
    selectedPackId: selectedPack.policyPackId,
    setSelectedPackId: vi.fn(),
    publishVersion: "",
    setPublishVersion: vi.fn(),
    publishJson: "{}",
    setPublishJson: vi.fn(),
    assignVersion: "",
    setAssignVersion: vi.fn(),
    assignScopeLevel: "workspace",
    setAssignScopeLevel: vi.fn(),
    assignPinned: false,
    setAssignPinned: vi.fn(),
    packVersions: [],
    compareLeftId: "",
    setCompareLeftId: vi.fn(),
    compareRightId: "",
    setCompareRightId: vi.fn(),
    showVersionDiff: false,
    setShowVersionDiff: vi.fn(),
    verticalImportSlug: null,
    bundledPublishBlocked: false,
    load: vi.fn(async () => undefined),
    importVerticalPolicyPack: vi.fn(async () => undefined),
    onCreate: vi.fn(async () => undefined),
    onPublish: vi.fn(async () => undefined),
    onAssign: vi.fn(async () => undefined),
    compareLeftVersion: undefined,
    compareRightVersion: undefined,
    selectedPackSummary: selectedPack,
    syncPolicyContentJson: vi.fn(),
    ruleIdFromUrl: "",
    generatedRuleCount: 0,
    generatedValidationErrors: [],
    applyGeneratedPolicyPack: vi.fn(),
    openAuthoringWizardFromGenerator: vi.fn(),
    authoringWizardInputMode: "guided",
    authoringAdvancedOpen: false,
    setAuthoringAdvancedOpen: vi.fn(),
    authoringToolsOpen: false,
    setAuthoringToolsOpen: vi.fn(),
    onCreateFromGenerator: vi.fn(async () => undefined),
    pickedReviewId: "",
    setPickedReviewId: vi.fn(),
    workspaceSelectionItems: [],
    workspaceSelectionLoading: false,
    togglingAssignmentId: null,
    onToggleWorkspaceSelection: vi.fn(async () => undefined),
    ...overrides,
  };
}

vi.mock("./PolicyPacksCatalogSection", () => ({
  PolicyPacksCatalogSection: () => <div data-testid="policy-packs-catalog-stub">Catalog</div>,
}));

vi.mock("./PolicyPacksRegisteredListSection", () => ({
  PolicyPacksRegisteredListSection: () => <div data-testid="policy-packs-registered-stub">Registered</div>,
}));

vi.mock("./PolicyPacksAdvancedAuthoringPanel", () => ({
  PolicyPacksAdvancedAuthoringPanel: () => null,
}));

vi.mock("@/components/policy/PolicyPackImpactPreviewPanel", () => ({
  PolicyPackImpactPreviewPanel: () => null,
}));

describe("PolicyPacksPageView buyer-polished shell", () => {
  it("surfaces header chrome, scope details, active pack summary, and enforced rules table", () => {
    render(<PolicyPacksPageView model={buildModel()} />);

    expect(screen.getByTestId("policy-pack-basis-status-banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Policy packs", level: 2 })).toBeInTheDocument();
    expect(screen.getByText(BUYER_POLICY_PACKS_PAGE_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-claim-discipline").textContent).toContain(
      POLICY_PACKS_HUB_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-refresh-button")).toBeInTheDocument();
    expect(screen.queryByTestId("policy-packs-scope-details")).toBeNull(); // TB-2093
    expect(screen.queryByTestId("policy-packs-standards-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pattern-library-policy-packs-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("policy-pack-detail-hub-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("governance-setup-config-hubs-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-active-pack-summary")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-enforced-rules-table")).toBeInTheDocument();
    expect(screen.getByText("PHI minimization on intake APIs")).toBeInTheDocument();
    expect(screen.queryByText(/Approval queue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Governance approval record/i)).not.toBeInTheDocument();
  });
});
