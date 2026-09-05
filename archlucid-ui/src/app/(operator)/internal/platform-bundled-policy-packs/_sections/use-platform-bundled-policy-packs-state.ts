"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { listPlatformBundledPolicyPacks, setPlatformBundledPolicyPackActivation } from "@/lib/api";
import { INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH } from "@/lib/internal-ops-route-paths";
import {
  parsePlatformBundledPolicyPacksCategoryFromSearch,
  parsePlatformBundledPolicyPacksSearchFromSearch,
  platformBundledPolicyPacksCategoryHrefFromSearch,
  platformBundledPolicyPacksSearchHrefFromSearch,
} from "@/lib/internal/platform-bundled-policy-packs-filter-url";
import {
  parsePlatformBundledPolicyPackActivateFileFromSearch,
  parsePlatformBundledPolicyPackActivateModeFromSearch,
  platformBundledPolicyPackActivationConfirmHrefFromSearch,
  type PlatformBundledPolicyPackActivateMode,
} from "@/lib/internal/platform-bundled-policy-pack-activation-confirm-url";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  platformBundledPolicyPackListLoadFailureMessage,
  platformBundledPolicyPackToggleSuccessMessage,
} from "@/lib/platform-bundled-policy-packs-page-copy";
import {
  derivePlatformBundledPolicyPackCategory,
  type PlatformBundledPolicyPackCategory,
} from "@/lib/platform-bundled-policy-packs-display";
import type { PlatformBundledPolicyPackRegistryEntry } from "@/types/policy-packs";

export type PendingPlatformBundledPolicyPackActivation = {
  row: PlatformBundledPolicyPackRegistryEntry;
  nextActive: boolean;
};

function rowMatchesFilters(
  row: PlatformBundledPolicyPackRegistryEntry,
  nameFilter: string,
  categoryFilter: PlatformBundledPolicyPackCategory,
): boolean {
  const normalizedFilter = nameFilter.trim().toLowerCase();

  if (normalizedFilter.length > 0 && !row.displayName.toLowerCase().includes(normalizedFilter)) {
    return false;
  }

  if (categoryFilter !== "all") {
    const derived = derivePlatformBundledPolicyPackCategory(row.bundleContentFile);

    if (derived !== categoryFilter) {
      return false;
    }
  }

  return true;
}

export function usePlatformBundledPolicyPacksState() {
  const router = useRouter();
  const pathname = usePathname() ?? INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlNameFilter = parsePlatformBundledPolicyPacksSearchFromSearch(searchParams.get("q"));
  const urlCategoryFilter = parsePlatformBundledPolicyPacksCategoryFromSearch(searchParams.get("category"));
  const bundleActivateFileParam = searchParams.get("bundleActivateFile");
  const bundleActivateModeParam = searchParams.get("bundleActivateMode");
  const urlActivateFile = parsePlatformBundledPolicyPackActivateFileFromSearch(bundleActivateFileParam);
  const urlActivateMode = parsePlatformBundledPolicyPackActivateModeFromSearch(bundleActivateModeParam);
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const [rows, setRows] = useState<PlatformBundledPolicyPackRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingFile, setUpdatingFile] = useState<string | null>(null);
  const [toggleMessage, setToggleMessage] = useState<string | null>(null);
  const [nameFilter, setNameFilterState] = useState(urlNameFilter);
  const [categoryFilter, setCategoryFilterState] = useState<PlatformBundledPolicyPackCategory>(urlCategoryFilter);
  const [pendingActivation, setPendingActivationState] = useState<PendingPlatformBundledPolicyPackActivation | null>(null);
  const [deactivateAcknowledgment, setDeactivateAcknowledgment] = useState("");

  const syncActivationConfirmToUrl = useCallback(
    (state: { bundleContentFile: string | null; mode: PlatformBundledPolicyPackActivateMode | null }) => {
      router.replace(
        platformBundledPolicyPackActivationConfirmHrefFromSearch(searchParams.toString(), state, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingActivation = useCallback(
    (value: SetStateAction<PendingPlatformBundledPolicyPackActivation | null>) => {
      setPendingActivationState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncActivationConfirmToUrl(
          next === null
            ? { bundleContentFile: null, mode: null }
            : {
                bundleContentFile: next.row.bundleContentFile,
                mode: next.nextActive ? "activate" : "deactivate",
              },
        );

        return next;
      });
    },
    [syncActivationConfirmToUrl],
  );

  useEffect(() => {
    if (urlActivateFile.length === 0 || urlActivateMode === null) {
      setPendingActivationState(null);

      return;
    }

    if (rows.length === 0) {
      return;
    }

    const row = rows.find((entry) => entry.bundleContentFile === urlActivateFile);

    if (row === undefined) {
      return;
    }

    const nextActive = urlActivateMode === "activate";

    if (
      pendingActivation?.row.bundleContentFile === urlActivateFile
      && pendingActivation.nextActive === nextActive
    ) {
      return;
    }

    setPendingActivationState({ row, nextActive });
  }, [pendingActivation?.nextActive, pendingActivation?.row.bundleContentFile, rows, urlActivateFile, urlActivateMode]);

  useEffect(() => {
    setNameFilterState(urlNameFilter);
  }, [urlNameFilter]);

  useEffect(() => {
    setCategoryFilterState(urlCategoryFilter);
  }, [urlCategoryFilter]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = platformBundledPolicyPacksSearchHrefFromSearch(searchParams.toString(), nameFilter, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [nameFilter, pathname, router, searchParams]);

  const setNameFilter = useCallback((value: string) => {
    setNameFilterState(value);
  }, []);

  const setCategoryFilter = useCallback(
    (value: PlatformBundledPolicyPackCategory) => {
      setCategoryFilterState(value);
      router.replace(platformBundledPolicyPacksCategoryHrefFromSearch(currentSearch, value, pathname), {
        scroll: false,
      });
    },
    [currentSearch, pathname, router],
  );

  const load = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setLoadError(null);

    try {
      const data = await listPlatformBundledPolicyPacks();
      setRows(data);

      return true;
    } catch (cause) {
      setLoadError(platformBundledPolicyPackListLoadFailureMessage(cause instanceof Error ? cause.message : String(cause)));

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorityLoading || !isAdmin) {
      return;
    }

    void load();
  }, [isAdmin, isAuthorityLoading, load]);

  const filteredRows = useMemo(
    () => rows.filter((row) => rowMatchesFilters(row, nameFilter, categoryFilter)),
    [rows, nameFilter, categoryFilter],
  );

  const hasActiveFilters = nameFilter.trim().length > 0 || categoryFilter !== "all";

  const openActivationConfirm = useCallback((row: PlatformBundledPolicyPackRegistryEntry) => {
    setToggleMessage(null);
    setDeactivateAcknowledgment("");
    setPendingActivation({
      row,
      nextActive: !row.isGloballyActive,
    });
  }, [setPendingActivation]);

  const confirmPendingActivation = useCallback(async () => {
    if (pendingActivation === null || updatingFile !== null) {
      return;
    }

    const { row, nextActive } = pendingActivation;
    setUpdatingFile(row.bundleContentFile);
    setLoadError(null);

    try {
      const updated = await setPlatformBundledPolicyPackActivation(row.bundleContentFile, nextActive);

      setRows((current) =>
        current.map((entry) =>
          entry.bundleContentFile === updated.bundleContentFile ? updated : entry,
        ),
      );
      setToggleMessage(platformBundledPolicyPackToggleSuccessMessage(row.displayName, nextActive));
      setPendingActivation(null);
      setDeactivateAcknowledgment("");

      const reloaded = await load();

      if (!reloaded) {
        setToggleMessage(null);
      }
    } catch (cause) {
      setLoadError(platformBundledPolicyPackListLoadFailureMessage(cause instanceof Error ? cause.message : String(cause)));
    } finally {
      setUpdatingFile(null);
    }
  }, [load, pendingActivation, setPendingActivation, updatingFile]);

  const cancelPendingActivation = useCallback(() => {
    if (updatingFile === null) {
      setPendingActivation(null);
      setDeactivateAcknowledgment("");
    }
  }, [updatingFile, setPendingActivation]);

  return {
    isAuthorityLoading,
    isAdmin,
    rows,
    loading,
    loadError,
    updatingFile,
    toggleMessage,
    nameFilter,
    setNameFilter,
    categoryFilter,
    setCategoryFilter,
    pendingActivation,
    deactivateAcknowledgment,
    setDeactivateAcknowledgment,
    filteredRows,
    hasActiveFilters,
    load,
    openActivationConfirm,
    confirmPendingActivation,
    cancelPendingActivation,
  };
}

export type PlatformBundledPolicyPacksState = ReturnType<typeof usePlatformBundledPolicyPacksState>;
