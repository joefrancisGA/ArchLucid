"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { fetchPolicyPacksPageBundle } from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  mergePolicyPacksStateWithStaticDemo,
  staticDemoPolicyPacksFallbackBundle,
} from "@/lib/operator/operator-static-demo";
import { useNavSurface } from "@/lib/use-nav-surface";
import type {
  EffectivePolicyPackSet,
  PolicyPack,
  PolicyPackContentDocument,
} from "@/types/policy-packs";

import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { POLICY_PACK_ID_QUERY_PARAM, POLICY_PACKS_TAB_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";
import {
  parsePolicyPacksTabFromSearch,
  policyPacksTabHrefFromSearch,
} from "@/lib/policy/policy-packs-tab-url";
import type { PolicyPacksPageServerLoad } from "./load-policy-packs-page-data";
import type { PolicyPacksPageTab, PolicyPacksPageViewModel } from "./policy-packs-page-view-model";
import { usePolicyPacksAuthoring } from "./use-policy-packs-authoring";
import { usePolicyPacksCatalog } from "./use-policy-packs-catalog";
import { usePolicyPacksWorkspaceSelection } from "./use-policy-packs-workspace-selection";

export function usePolicyPacksPage(serverLoad: PolicyPacksPageServerLoad): PolicyPacksPageViewModel {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_POLICY_PACKS_PATH;
  const searchParams = useSearchParams();
  const packIdFromUrl = searchParams.get(POLICY_PACK_ID_QUERY_PARAM)?.trim() ?? "";
  const pageTabFromUrl = parsePolicyPacksTabFromSearch(searchParams.get(POLICY_PACKS_TAB_QUERY_PARAM));
  const canMutatePacks = useNavSurface("policy-packs").mutationCapability;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const [packs, setPacks] = useState<PolicyPack[]>(serverLoad.packs);
  const [effective, setEffective] = useState<EffectivePolicyPackSet | null>(serverLoad.effective);
  const [effectiveContent, setEffectiveContent] = useState<PolicyPackContentDocument | null>(
    serverLoad.effectiveContent,
  );
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(() => new Date());
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(serverLoad.failure);
  const [pageTab, setPageTabState] = useState<PolicyPacksPageTab>(pageTabFromUrl);

  const setPageTab = useCallback(
    (next: SetStateAction<PolicyPacksPageTab>) => {
      setPageTabState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        router.replace(policyPacksTabHrefFromSearch(searchParams.toString(), resolved, pathname), { scroll: false });

        return resolved;
      });
    },
    [pathname, router, searchParams],
  );

  const loadRef = useRef<() => Promise<void>>(async () => {});

  const workspace = usePolicyPacksWorkspaceSelection({
    canMutatePacks,
    load: async () => {
      await loadRef.current();
    },
    setFailure,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const bundle = await fetchPolicyPacksPageBundle();
      const merged = mergePolicyPacksStateWithStaticDemo(
        bundle.packs,
        bundle.effective,
        bundle.effectiveContent,
        "default",
        {
          afterEmptyLiveResponse:
            buyerPolishedShell ||
            (bundle.packs.length === 0 && (bundle.effective === null || bundle.effective.packs.length === 0)),
        },
      );

      setPacks(merged.packs);
      setEffective(merged.effective);
      setEffectiveContent(merged.content);
      await workspace.refreshWorkspaceSelection();
    } catch (e) {
      const fb = staticDemoPolicyPacksFallbackBundle("default", { afterAuthorityFailure: true });

      if (fb !== null) {
        setPacks(fb.packs);
        setEffective(fb.effective);
        setEffectiveContent(fb.content);
        setFailure(null);
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      setLoading(false);
      setLastRefreshedAt(new Date());
    }
  }, [buyerPolishedShell, workspace.refreshWorkspaceSelection]);

  loadRef.current = load;

  const authoring = usePolicyPacksAuthoring({
    canMutatePacks,
    packs,
    packIdFromUrl,
    pageTabFromUrl,
    pageTab,
    setPageTab,
    load,
    setLoading,
    setFailure,
  });

  const catalog = usePolicyPacksCatalog({
    canMutatePacks,
    pageTab,
    setPageTab,
    setSelectedPackId: authoring.setSelectedPackId,
    load,
    setLoading,
  });

  useEffect(() => {
    setPageTabState(pageTabFromUrl);
  }, [pageTabFromUrl]);

  return {
    canMutatePacks,
    buyerPolishedShell,
    pageTab,
    setPageTab,
    catalogItems: catalog.catalogItems,
    catalogLoading: catalog.catalogLoading,
    catalogFailure: catalog.catalogFailure,
    selectedCatalogEntryId: catalog.selectedCatalogEntryId,
    setSelectedCatalogEntryId: catalog.setSelectedCatalogEntryId,
    refreshCatalog: catalog.refreshCatalog,
    onCloneCatalogEntry: catalog.onCloneCatalogEntry,
    workspaceSelectionItems: workspace.workspaceSelectionItems,
    workspaceSelectionLoading: workspace.workspaceSelectionLoading,
    togglingAssignmentId: workspace.togglingAssignmentId,
    togglingOrganizationRequiredAssignmentId: workspace.togglingOrganizationRequiredAssignmentId,
    onToggleWorkspaceSelection: workspace.onToggleWorkspaceSelection,
    onToggleOrganizationRequired: workspace.onToggleOrganizationRequired,
    packs,
    effective,
    effectiveContent,
    loading,
    lastRefreshedAt,
    failure,
    load,
    ...authoring,
  };
}
