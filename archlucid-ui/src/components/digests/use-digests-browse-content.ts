"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useArchitectureDigestsBrowseQuery } from "@/hooks/use-architecture-digests-browse-query";
import { useDigestDeliveryAttemptsBatchQuery } from "@/hooks/use-digest-delivery-attempts-batch-query";
import {
  buildDigestSetupChecklistItems,
  digestSetupHasIncompleteActionableStep,
  type DigestSetupChecklistItem,
} from "@/lib/digest-setup-gap-actions";
import { digestIdFromLocationHash, digestRowElementId } from "@/lib/digests-browse-deep-link";
import {
  resolveContinueLastDigestBrowse,
  writeDigestBrowseLastViewedId,
} from "@/lib/resolve-continue-last-digest-browse";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { getArchitectureDigest, listDigestDeliveryAttempts } from "@/lib/api";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

const EMPTY_DIGESTS: ArchitectureDigest[] = [];

export type UseDigestsBrowseContentOptions = {
  readonly refreshToken?: number;
  readonly onLoaded?: () => void;
  readonly healthSnap?: WeeklyDigestHealthDto | null;
};

export type UseDigestsBrowseContentResult = {
  readonly digests: readonly ArchitectureDigest[];
  readonly rowAttempts: Record<string, DigestDeliveryAttempt[]>;
  readonly selected: ArchitectureDigest | null;
  readonly deliveryAttempts: DigestDeliveryAttempt[];
  readonly detailFailure: ApiLoadFailureState | null;
  readonly previewOpen: boolean;
  readonly setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  readonly detailPanelRef: React.RefObject<HTMLElement | null>;
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly selectDigest: (digestId: string) => Promise<void>;
  readonly setupChecklist: readonly DigestSetupChecklistItem[] | null;
  readonly setupIncomplete: boolean;
  readonly showEmptyComposition: boolean;
  readonly continueLastDigest: ReturnType<typeof resolveContinueLastDigestBrowse>;
  readonly openContinueLastDigest: (digestId: string) => void;
};

export function useDigestsBrowseContent(
  options: UseDigestsBrowseContentOptions = {},
): UseDigestsBrowseContentResult {
  const { refreshToken = 0, onLoaded, healthSnap = null } = options;
  const digestsQuery = useArchitectureDigestsBrowseQuery(40);
  const digests = digestsQuery.data ?? EMPTY_DIGESTS;
  const digestIds = useMemo(() => digests.map((digest) => digest.digestId), [digests]);
  const rowAttemptsQuery = useDigestDeliveryAttemptsBatchQuery(digestIds, {
    enabled: digests.length > 0,
  });
  const rowAttempts = rowAttemptsQuery.data ?? {};
  const [selected, setSelected] = useState<ArchitectureDigest | null>(null);
  const [deliveryAttempts, setDeliveryAttempts] = useState<DigestDeliveryAttempt[]>([]);
  const [detailFailure, setDetailFailure] = useState<ApiLoadFailureState | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const detailPanelRef = useRef<HTMLElement | null>(null);
  const loading = digestsQuery.isLoading;
  const failure =
    detailFailure ??
    (digestsQuery.isError ? toApiLoadFailure(digestsQuery.error) : null);

  const selectDigest = useCallback(async (digestId: string): Promise<void> => {
    setDetailFailure(null);
    writeDigestBrowseLastViewedId(digestId);

    try {
      const full = await getArchitectureDigest(digestId);
      setSelected(full);
      const attempts = await listDigestDeliveryAttempts(digestId);
      setDeliveryAttempts(attempts);
      setPreviewOpen(true);
    } catch (e) {
      setDetailFailure(toApiLoadFailure(e));
    }
  }, []);

  useEffect(() => {
    if (!digestsQuery.isFetched) {
      return;
    }

    onLoaded?.();
  }, [digestsQuery.isFetched, onLoaded]);

  useEffect(() => {
    if (refreshToken === 0) {
      return;
    }

    void digestsQuery.refetch();
  }, [refreshToken, digestsQuery.refetch]);

  useEffect(() => {
    setSelected(null);
    setDeliveryAttempts([]);
  }, [refreshToken]);

  /**
   * Honors `/digests?tab=get-started#digest-{id}` from the hub Preview action and
   * schedule links (TB-1501). Re-runs on hashchange so repeat clicks re-select.
   */
  useEffect(() => {
    if (digests.length === 0) {
      return;
    }

    function selectFromHash(): void {
      const hashDigestId: string | null = digestIdFromLocationHash(window.location.hash);

      if (hashDigestId === null) {
        return;
      }

      const match: ArchitectureDigest | undefined = digests.find(
        (digest) => digest.digestId === hashDigestId,
      );

      if (match === undefined) {
        return;
      }

      void selectDigest(match.digestId).then(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);

    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [digests, selectDigest]);

  const setupChecklist: readonly DigestSetupChecklistItem[] | null =
    healthSnap !== null ? buildDigestSetupChecklistItems(healthSnap, digests.length > 0) : null;
  const setupIncomplete: boolean =
    setupChecklist !== null ? digestSetupHasIncompleteActionableStep(setupChecklist) : false;
  const showEmptyComposition: boolean = !loading && digests.length === 0 && failure === null;
  const continueLastDigest = useMemo(() => resolveContinueLastDigestBrowse(digests), [digests]);

  const openContinueLastDigest = useCallback(
    (digestId: string) => {
      const row = document.getElementById(digestRowElementId(digestId));

      if (row !== null) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      void selectDigest(digestId).then(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [selectDigest],
  );

  return {
    digests,
    rowAttempts,
    selected,
    deliveryAttempts,
    detailFailure,
    previewOpen,
    setPreviewOpen,
    detailPanelRef,
    loading,
    failure,
    selectDigest,
    setupChecklist,
    setupIncomplete,
    showEmptyComposition,
    continueLastDigest,
    openContinueLastDigest,
  };
}
