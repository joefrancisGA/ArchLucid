"use client";

import { useCallback, useEffect, useState } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createPolicyPack, getPolicyPackCatalogEntry, listPolicyPackCatalog } from "@/lib/api";
import { showSuccess } from "@/lib/toast";
import type { PolicyPack, PolicyPackCatalogListItem } from "@/types/policy-packs";

import type { PolicyPacksPageTab } from "./policy-packs-page-view-model";

export type PolicyPacksCatalogControls = {
  readonly canMutatePacks: boolean;
  readonly pageTab: PolicyPacksPageTab;
  readonly setPageTab: (tab: PolicyPacksPageTab) => void;
  readonly setSelectedPackId: (id: string) => void;
  readonly load: () => Promise<void>;
  readonly setLoading: (loading: boolean) => void;
};

export type PolicyPacksCatalogSlice = {
  readonly catalogItems: PolicyPackCatalogListItem[];
  readonly catalogLoading: boolean;
  readonly catalogFailure: ApiLoadFailureState | null;
  readonly selectedCatalogEntryId: string;
  readonly setSelectedCatalogEntryId: React.Dispatch<React.SetStateAction<string>>;
  readonly refreshCatalog: () => Promise<void>;
  readonly onCloneCatalogEntry: () => Promise<void>;
};

export function usePolicyPacksCatalog(controls: PolicyPacksCatalogControls): PolicyPacksCatalogSlice {
  const [catalogItems, setCatalogItems] = useState<PolicyPackCatalogListItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogFailure, setCatalogFailure] = useState<ApiLoadFailureState | null>(null);
  const [selectedCatalogEntryId, setSelectedCatalogEntryId] = useState("");

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogFailure(null);

    try {
      const rows: PolicyPackCatalogListItem[] = await listPolicyPackCatalog();
      setCatalogItems(rows);

      setSelectedCatalogEntryId((prev) => {
        if (prev.length > 0 && rows.some((r) => r.policyPackCatalogEntryId === prev)) {
          return prev;
        }

        return rows[0]?.policyPackCatalogEntryId ?? "";
      });
    } catch (e: unknown) {
      setCatalogFailure(toApiLoadFailure(e));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (controls.pageTab !== "catalog") {
      return;
    }

    void refreshCatalog();
  }, [controls.pageTab, refreshCatalog]);

  const onCloneCatalogEntry = useCallback(async () => {
    if (!controls.canMutatePacks || selectedCatalogEntryId.length === 0) {
      return;
    }

    setCatalogFailure(null);
    controls.setLoading(true);

    try {
      const detail = await getPolicyPackCatalogEntry(selectedCatalogEntryId);
      const json = detail.snapshotContentJson ?? "{}";

      JSON.parse(json);

      const created: PolicyPack = await createPolicyPack({
        name: `${detail.displayName ?? "Catalog pack"} (copy)`,
        description: detail.description ?? "",
        packType: detail.packType ?? "ProjectCustom",
        initialContentJson: json,
      });
      await controls.load();
      controls.setSelectedPackId(created.policyPackId);
      controls.setPageTab("my-packs");
      showSuccess("Cloned catalog pack into your workspace.");
    } catch (e: unknown) {
      setCatalogFailure(toApiLoadFailure(e));
    } finally {
      controls.setLoading(false);
    }
  }, [controls, selectedCatalogEntryId]);

  return {
    catalogItems,
    catalogLoading,
    catalogFailure,
    selectedCatalogEntryId,
    setSelectedCatalogEntryId,
    refreshCatalog,
    onCloneCatalogEntry,
  };
}
