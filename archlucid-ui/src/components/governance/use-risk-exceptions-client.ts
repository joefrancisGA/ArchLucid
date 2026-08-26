"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import {
  defaultRiskExceptionExpiresAtUtc,
  listRiskExceptions,
  renewRiskException,
  revokeRiskException,
  type RiskExceptionRecord,
} from "@/lib/api/governance-stickiness-api";
import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";
import { resolveRiskExceptionsTriageFirstExpiring } from "@/lib/governance/resolve-risk-exceptions-triage-first-expiring";
import {
  resolveContinueLastRiskException,
  writeRiskExceptionLastViewedId,
} from "@/lib/resolve-continue-last-risk-exception";
import {
  resolveRiskExceptionsRenewEmphasizedStepId,
  resolveRiskExceptionsRenewSteps,
} from "@/lib/risk-exceptions-renew-checklist";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";

import {
  matchesRiskExceptionRunScope,
  riskExceptionsLoadFailureMessage,
  sortByExpiryAsc,
} from "./risk-exceptions-client-helpers";
import { resolveRiskExceptionDisplayStatus } from "./risk-exception-status";

export type UseRiskExceptionsClientResult = {
  readonly scopedRunId: string;
  readonly scopedRunFilterActive: boolean;
  readonly canMutate: boolean;
  readonly mutationDisabledHintId: string;
  readonly mutationDisabledReason: ReturnType<typeof whyDisabledEnterpriseMutationControl>;
  readonly records: RiskExceptionRecord[];
  readonly scopedRecords: RiskExceptionRecord[];
  readonly loadError: string | null;
  readonly busyId: string | null;
  readonly renewingId: string | null;
  readonly setRenewingId: React.Dispatch<React.SetStateAction<string | null>>;
  readonly renewExpiresAtUtc: string;
  readonly setRenewExpiresAtUtc: React.Dispatch<React.SetStateAction<string>>;
  readonly renewRationale: string;
  readonly setRenewRationale: React.Dispatch<React.SetStateAction<string>>;
  readonly pendingRevoke: RiskExceptionRecord | null;
  readonly setPendingRevoke: React.Dispatch<React.SetStateAction<RiskExceptionRecord | null>>;
  readonly loading: boolean;
  readonly retryingLoad: boolean;
  readonly handleRetryLoad: () => void;
  readonly expiringSoonCount: number;
  readonly triageFirstExpiringTarget: ReturnType<typeof resolveRiskExceptionsTriageFirstExpiring>;
  readonly continueLastException: ReturnType<typeof resolveContinueLastRiskException>;
  readonly riskExceptionsRenewChecklistSteps: ReturnType<typeof resolveRiskExceptionsRenewSteps>;
  readonly riskExceptionsRenewChecklistEmphasizedStepId: ReturnType<typeof resolveRiskExceptionsRenewEmphasizedStepId>;
  readonly onPickReviewForRenew: (reviewId: string) => void;
  readonly submitRenew: (record: RiskExceptionRecord) => Promise<void>;
  readonly submitRevoke: (record: RiskExceptionRecord) => Promise<void>;
  readonly onTriageExtend: (riskExceptionId: string) => void;
  readonly onContinueLastOpen: (riskExceptionId: string) => void;
  readonly onStartRenew: (riskExceptionId: string) => void;
};

export function useRiskExceptionsClient(): UseRiskExceptionsClientResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const canMutate = useOperateCapability();
  const mutationDisabledHintId = "risk-exceptions-mutate-disabled-hint";
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();
  const [records, setRecords] = useState<RiskExceptionRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewExpiresAtUtc, setRenewExpiresAtUtc] = useState(defaultRiskExceptionExpiresAtUtc());
  const [renewRationale, setRenewRationale] = useState("");
  const [pendingRevoke, setPendingRevoke] = useState<RiskExceptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryingLoad, setRetryingLoad] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(async (): Promise<void> => {
    const rows = await listRiskExceptions();
    setRecords(sortByExpiryAsc(rows));
  }, []);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setReloadToken((value) => value + 1);
  }, []);

  const handleRetryLoad = useCallback(() => {
    setRetryingLoad(true);
    retryLoad();
  }, [retryLoad]);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      setLoading(true);
      setLoadError(null);

      try {
        await reload();
      } catch (error: unknown) {
        if (!canceled) {
          setLoadError(riskExceptionsLoadFailureMessage(error));
        }
      } finally {
        if (!canceled) {
          setLoading(false);
          setRetryingLoad(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [reload, reloadToken]);

  const scopedRecords = useMemo(
    () => records.filter((record) => matchesRiskExceptionRunScope(record, scopedRunId)),
    [records, scopedRunId],
  );

  const expiringSoonCount = useMemo(
    () => scopedRecords.filter((row) => resolveRiskExceptionDisplayStatus(row) === "expiring-soon").length,
    [scopedRecords],
  );
  const triageFirstExpiringTarget = useMemo(
    () => (scopedRunFilterActive ? resolveRiskExceptionsTriageFirstExpiring(scopedRecords) : null),
    [scopedRecords, scopedRunFilterActive],
  );
  const continueLastException = useMemo(
    () => (scopedRunFilterActive ? resolveContinueLastRiskException(scopedRecords) : null),
    [scopedRecords, scopedRunFilterActive],
  );
  const riskExceptionsRenewChecklistSteps = resolveRiskExceptionsRenewSteps({
    reviewPicked: scopedRunFilterActive,
    expiringReviewed: scopedRunFilterActive && (expiringSoonCount === 0 || triageFirstExpiringTarget === null),
    renewReady: scopedRunFilterActive && scopedRecords.length > 0 && !loading,
  });
  const riskExceptionsRenewChecklistEmphasizedStepId = resolveRiskExceptionsRenewEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    expiringReviewed: scopedRunFilterActive && (expiringSoonCount === 0 || triageFirstExpiringTarget === null),
    renewReady: scopedRunFilterActive && scopedRecords.length > 0 && !loading,
  });

  const onPickReviewForRenew = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);
      router.replace(`${GOVERNANCE_EXCEPTIONS_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const submitRenew = useCallback(
    async (record: RiskExceptionRecord): Promise<void> => {
      if (!canMutate) {
        return;
      }

      setBusyId(record.riskExceptionId);
      setLoadError(null);
      writeRiskExceptionLastViewedId(record.riskExceptionId);

      try {
        await renewRiskException(record.riskExceptionId, {
          expiresAtUtc: renewExpiresAtUtc,
          rationale: renewRationale.trim().length > 0 ? renewRationale.trim() : undefined,
        });

        setRenewingId(null);
        setRenewRationale("");
        setRenewExpiresAtUtc(defaultRiskExceptionExpiresAtUtc());
        await reload();
      } catch (error: unknown) {
        setLoadError(error instanceof Error ? error.message : "Failed to renew risk exception.");
      } finally {
        setBusyId(null);
      }
    },
    [canMutate, renewExpiresAtUtc, renewRationale, reload],
  );

  const submitRevoke = useCallback(
    async (record: RiskExceptionRecord): Promise<void> => {
      if (!canMutate) {
        return;
      }

      setBusyId(record.riskExceptionId);
      setLoadError(null);
      writeRiskExceptionLastViewedId(record.riskExceptionId);

      try {
        await revokeRiskException(record.riskExceptionId);
        await reload();
      } catch (error: unknown) {
        setLoadError(error instanceof Error ? error.message : "Failed to revoke risk exception.");
      } finally {
        setBusyId(null);
      }
    },
    [canMutate, reload],
  );

  const onTriageExtend = useCallback((riskExceptionId: string) => {
    setRenewingId(riskExceptionId);
    setRenewExpiresAtUtc(defaultRiskExceptionExpiresAtUtc());
    setRenewRationale("");
    document
      .querySelector(`[data-risk-exception-id="${riskExceptionId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const onContinueLastOpen = useCallback((riskExceptionId: string) => {
    writeRiskExceptionLastViewedId(riskExceptionId);
    document
      .querySelector(`[data-risk-exception-id="${riskExceptionId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const onStartRenew = useCallback((riskExceptionId: string) => {
    setRenewingId(riskExceptionId);
    setRenewExpiresAtUtc(defaultRiskExceptionExpiresAtUtc());
    setRenewRationale("");
  }, []);

  return {
    scopedRunId,
    scopedRunFilterActive,
    canMutate,
    mutationDisabledHintId,
    mutationDisabledReason,
    records,
    scopedRecords,
    loadError,
    busyId,
    renewingId,
    setRenewingId,
    renewExpiresAtUtc,
    setRenewExpiresAtUtc,
    renewRationale,
    setRenewRationale,
    pendingRevoke,
    setPendingRevoke,
    loading,
    retryingLoad,
    handleRetryLoad,
    expiringSoonCount,
    triageFirstExpiringTarget,
    continueLastException,
    riskExceptionsRenewChecklistSteps,
    riskExceptionsRenewChecklistEmphasizedStepId,
    onPickReviewForRenew,
    submitRenew,
    submitRevoke,
    onTriageExtend,
    onContinueLastOpen,
    onStartRenew,
  };
}
