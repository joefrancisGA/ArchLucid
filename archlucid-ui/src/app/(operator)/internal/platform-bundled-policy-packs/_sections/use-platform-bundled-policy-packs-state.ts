"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { listPlatformBundledPolicyPacks, setPlatformBundledPolicyPackActivation } from "@/lib/api";
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
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  const [rows, setRows] = useState<PlatformBundledPolicyPackRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingFile, setUpdatingFile] = useState<string | null>(null);
  const [toggleMessage, setToggleMessage] = useState<string | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<PlatformBundledPolicyPackCategory>("all");
  const [pendingActivation, setPendingActivation] = useState<PendingPlatformBundledPolicyPackActivation | null>(null);
  const [deactivateAcknowledgment, setDeactivateAcknowledgment] = useState("");

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
  }, []);

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
  }, [load, pendingActivation, updatingFile]);

  const cancelPendingActivation = useCallback(() => {
    if (updatingFile === null) {
      setPendingActivation(null);
      setDeactivateAcknowledgment("");
    }
  }, [updatingFile]);

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
