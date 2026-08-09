import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PolicyPacksPageView } from "./PolicyPacksPageView";
import type { PolicyPacksPageViewModel } from "./policy-packs-page-view-model";
import { policyPackPublishSuccessMessage } from "@/lib/governance-mutation-outcome-copy";

function buildModel(overrides: Partial<PolicyPacksPageViewModel> = {}): PolicyPacksPageViewModel {
  return {
    canMutatePacks: true,
    buyerPolishedShell: false,
    pageTab: "my-packs",
    setPageTab: vi.fn(),
    catalogItems: [],
    catalogLoading: false,
    catalogFailure: null,
    selectedCatalogEntryId: "",
    setSelectedCatalogEntryId: vi.fn(),
    refreshCatalog: vi.fn(async () => undefined),
    onCloneCatalogEntry: vi.fn(async () => undefined),
    packs: [],
    effective: null,
    effectiveContent: null,
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
    selectedPackId: "",
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
    selectedPackSummary: undefined,
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

describe("PolicyPacksPageView tabs (TB-668)", () => {
  it("exposes tablist semantics on My packs and Catalog", () => {
    render(<PolicyPacksPageView model={buildModel()} />);

    expect(screen.getByRole("tablist", { name: "Policy packs sections" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "My packs" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Catalog" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByTestId("policy-packs-panel-my-packs")).toBeTruthy();
    expect(screen.getByTestId("policy-packs-registered-stub")).toBeTruthy();
  });

  it("switches to Catalog tabpanel and calls setPageTab", () => {
    const setPageTab = vi.fn();

    render(<PolicyPacksPageView model={buildModel({ setPageTab })} />);

    fireEvent.click(screen.getByRole("tab", { name: "Catalog" }));

    expect(setPageTab).toHaveBeenCalledWith("catalog");
  });

  it("surfaces publish success inline without toast (TB-2114)", () => {
    const publishMessage = policyPackPublishSuccessMessage("1.2.0");

    render(<PolicyPacksPageView model={buildModel({ publishSuccessMessage: publishMessage })} />);

    expect(screen.getByTestId("policy-pack-publish-success-callout")).toHaveTextContent(publishMessage);
  });
});
