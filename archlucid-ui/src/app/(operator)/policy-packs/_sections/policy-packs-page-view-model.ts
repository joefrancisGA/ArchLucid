import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type {
  EffectivePolicyPackSet,
  PolicyPack,
  PolicyPackContentDocument,
  PolicyPackVersion,
} from "@/types/policy-packs";

export type PolicyPacksPageViewModel = {
  readonly canMutatePacks: boolean;
  readonly buyerPolishedShell: boolean;
  readonly packs: PolicyPack[];
  readonly effective: EffectivePolicyPackSet | null;
  readonly effectiveContent: PolicyPackContentDocument | null;
  readonly loading: boolean;
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
  readonly load: () => Promise<void>;
  readonly importVerticalPolicyPack: (slug: string, label: string) => Promise<void>;
  readonly onCreate: () => Promise<void>;
  readonly onPublish: () => Promise<void>;
  readonly onAssign: () => Promise<void>;
  readonly compareLeftVersion: PolicyPackVersion | undefined;
  readonly compareRightVersion: PolicyPackVersion | undefined;
  readonly selectedPackSummary: PolicyPack | undefined;
};
