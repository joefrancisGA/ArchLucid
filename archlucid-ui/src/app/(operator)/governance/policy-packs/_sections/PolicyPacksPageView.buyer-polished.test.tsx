import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPacksPageView } from "./PolicyPacksPageView";
import type { PolicyPacksPageViewModel } from "./policy-packs-page-view-model";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import type { EffectivePolicyPackSet, PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";

const selectedPack: PolicyPack = {
  policyPackId: "demo-healthcare-claims-pack",
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
    packs: [selectedPack],
    effective,
    effectiveContent,
    loading: false,
    failure: null,
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

vi.mock("@/components/PolicyPackImpactPreviewPanel", () => ({
  PolicyPackImpactPreviewPanel: () => null,
}));

describe("PolicyPacksPageView buyer-polished shell", () => {
  it("surfaces active pack summary, enforced rules table, and policy-pack basis banner", () => {
    render(<PolicyPacksPageView model={buildModel()} />);

    expect(screen.getByTestId("policy-pack-basis-status-banner")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Policy packs", level: 2 })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Review the policy pack currently applied to this workspace and the rules enforced for this review/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-active-pack-summary")).toBeInTheDocument();
    expect(screen.getByTestId("policy-packs-enforced-rules-table")).toBeInTheDocument();
    expect(screen.getByText("PHI minimization on intake APIs")).toBeInTheDocument();
    expect(screen.queryByText(/Approval queue/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Governance approval record/i)).not.toBeInTheDocument();
  });
});
