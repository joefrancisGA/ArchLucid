import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { CuratedRulesDocument } from "@/lib/policy/policy-pack-curated-rules-v1";
import type {
  EffectivePolicyPackSet,
  PolicyPack,
  PolicyPackCatalogListItem,
  PolicyPackContentDocument,
  PolicyPackVersion,
  PolicyPackWorkspaceSelectionItem,
} from "@/types/policy-packs";

/** Primary sections on the policy packs page. */
export type PolicyPacksPageTab = "my-packs" | "catalog" | "generator" | "author";

/** Client view-model for {@link PolicyPacksPageView}; produced by {@link usePolicyPacksPage} after server hydration. */
export type PolicyPacksPageViewModel = {
  readonly canMutatePacks: boolean;
  readonly buyerPolishedShell: boolean;
  readonly pageTab: PolicyPacksPageTab;
  readonly setPageTab: Dispatch<SetStateAction<PolicyPacksPageTab>>;
  readonly catalogItems: PolicyPackCatalogListItem[];
  readonly catalogLoading: boolean;
  readonly catalogFailure: ApiLoadFailureState | null;
  readonly selectedCatalogEntryId: string;
  readonly setSelectedCatalogEntryId: Dispatch<SetStateAction<string>>;
  readonly refreshCatalog: () => Promise<void>;
  readonly onCloneCatalogEntry: () => Promise<void>;
  readonly workspaceSelectionItems: PolicyPackWorkspaceSelectionItem[];
  readonly workspaceSelectionLoading: boolean;
  readonly togglingAssignmentId: string | null;
  readonly togglingOrganizationRequiredAssignmentId: string | null;
  readonly onToggleWorkspaceSelection: (assignmentId: string, nextEnabled: boolean) => Promise<void>;
  readonly onToggleOrganizationRequired: (assignmentId: string, nextOrganizationRequired: boolean) => Promise<void>;
  readonly packs: PolicyPack[];
  readonly effective: EffectivePolicyPackSet | null;
  readonly effectiveContent: PolicyPackContentDocument | null;
  readonly loading: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly failure: ApiLoadFailureState | null;
  readonly name: string;
  readonly setName: Dispatch<SetStateAction<string>>;
  readonly description: string;
  readonly setDescription: Dispatch<SetStateAction<string>>;
  readonly packType: string;
  readonly setPackType: Dispatch<SetStateAction<string>>;
  readonly createJson: string;
  readonly setCreateJson: Dispatch<SetStateAction<string>>;
  readonly selectedPackId: string;
  readonly setSelectedPackId: Dispatch<SetStateAction<string>>;
  readonly publishVersion: string;
  readonly setPublishVersion: Dispatch<SetStateAction<string>>;
  readonly publishJson: string;
  readonly setPublishJson: Dispatch<SetStateAction<string>>;
  readonly publishBaselineJson: string | null;
  readonly assignVersion: string;
  readonly setAssignVersion: Dispatch<SetStateAction<string>>;
  readonly assignScopeLevel: string;
  readonly setAssignScopeLevel: Dispatch<SetStateAction<string>>;
  readonly assignPinned: boolean;
  readonly setAssignPinned: Dispatch<SetStateAction<boolean>>;
  readonly packVersions: PolicyPackVersion[];
  readonly compareLeftId: string;
  readonly setCompareLeftId: Dispatch<SetStateAction<string>>;
  readonly compareRightId: string;
  readonly setCompareRightId: Dispatch<SetStateAction<string>>;
  readonly showVersionDiff: boolean;
  readonly setShowVersionDiff: Dispatch<SetStateAction<boolean>>;
  readonly verticalImportSlug: string | null;
  readonly bundledPublishBlocked: boolean;
  readonly load: () => Promise<void>;
  readonly importVerticalPolicyPack: (slug: string, label: string) => Promise<void>;
  readonly onCreate: () => Promise<void>;
  readonly createLastSavedUtc: string | null;
  readonly createInlineSaveError: string | null;
  readonly onPublish: () => Promise<void>;
  readonly publishLastSavedUtc: string | null;
  readonly publishInlineSaveError: string | null;
  readonly onAssign: () => Promise<void>;
  readonly publishSuccessMessage: string | null;
  readonly setPublishSuccessMessage: Dispatch<SetStateAction<string | null>>;
  readonly compareLeftVersion: PolicyPackVersion | undefined;
  readonly compareRightVersion: PolicyPackVersion | undefined;
  readonly selectedPackSummary: PolicyPack | undefined;
  readonly syncPolicyContentJson: (json: string) => void;
  readonly ruleIdFromUrl: string;
  readonly generatedRuleCount: number;
  readonly generatedValidationErrors: readonly string[];
  readonly applyGeneratedPolicyPack: (document: CuratedRulesDocument) => void;
  readonly openAuthoringWizardFromGenerator: () => void;
  readonly authoringWizardInputMode: "guided" | "visual" | "json" | "ai";
  readonly authoringAdvancedOpen: boolean;
  readonly setAuthoringAdvancedOpen: Dispatch<SetStateAction<boolean>>;
  readonly authoringToolsOpen: boolean;
  readonly setAuthoringToolsOpen: Dispatch<SetStateAction<boolean>>;
  readonly onCreateFromGenerator: () => Promise<void>;
  readonly pickedReviewId: string;
  readonly setPickedReviewId: (reviewId: string) => void;
};
