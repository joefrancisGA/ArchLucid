"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuditEventTypes } from "@/lib/api";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import {
  CTO_DEMO_AUDIT_FILTER_QUERY_PARAM,
  isCtoDemoAuditFilterActive,
} from "@/lib/cto-demo-audit-filter";

import type { AuditPageServerLoad } from "./load-audit-page-data";
import { type AuditFilterFields, toDatetimeLocalInputValue } from "./audit-page-helpers";
import { useAuditPageUrlState } from "./use-audit-page-url-state";

export type UseAuditPageFiltersResult = {
  readonly advancedAuditFiltersOpen: boolean;
  readonly setAdvancedAuditFiltersOpen: Dispatch<SetStateAction<boolean>>;
  readonly buyerPrimaryFiltersOpen: boolean;
  readonly setBuyerPrimaryFiltersOpen: Dispatch<SetStateAction<boolean>>;
  readonly eventTypes: string[];
  readonly eventType: string;
  readonly setEventType: Dispatch<SetStateAction<string>>;
  readonly fromUtc: string;
  readonly setFromUtc: Dispatch<SetStateAction<string>>;
  readonly toUtc: string;
  readonly setToUtc: Dispatch<SetStateAction<string>>;
  readonly correlationId: string;
  readonly setCorrelationId: Dispatch<SetStateAction<string>>;
  readonly actorUserId: string;
  readonly setActorUserId: Dispatch<SetStateAction<string>>;
  readonly runId: string;
  readonly setRunId: Dispatch<SetStateAction<string>>;
  readonly loadingTypes: boolean;
  readonly auditDatePreset: null | "24h" | "7d";
  readonly setAuditDatePreset: Dispatch<SetStateAction<null | "24h" | "7d">>;
  readonly ctoDemoAuditFilterActive: boolean;
  readonly onClearCtoDemoAuditFilter: () => void;
  readonly auditFiltersActive: boolean;
  readonly currentFilters: () => AuditFilterFields;
  readonly resetFilterFields: () => void;
  readonly applyBuyerPolishedDateRangeFromEvents: (occurredUtcValues: readonly string[]) => void;
};

export function useAuditPageFilters(
  serverLoad: AuditPageServerLoad,
  buyerPolishedShell: boolean,
): UseAuditPageFiltersResult {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [advancedAuditFiltersOpen, setAdvancedAuditFiltersOpen] = useState(!buyerPolishedShell);
  const [buyerPrimaryFiltersOpen, setBuyerPrimaryFiltersOpen] = useState(false);
  const [eventTypes, setEventTypes] = useState<string[]>(serverLoad.eventTypes);
  const [eventType, setEventType] = useState<string>("");
  const [fromUtc, setFromUtc] = useState<string>("");
  const [toUtc, setToUtc] = useState<string>("");
  const [correlationId, setCorrelationId] = useState<string>("");
  const [actorUserId, setActorUserId] = useState<string>("");
  const [runId, setRunId] = useState<string>(() => searchParams.get("runId")?.trim() ?? "");
  const [loadingTypes, setLoadingTypes] = useState(serverLoad.typesLoadFailure !== null);
  const [auditDatePreset, setAuditDatePreset] = useState<null | "24h" | "7d">(null);
  const ctoDemoAuditFilterActive = isCtoDemoAuditFilterActive(searchParams.get(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM));

  useAuditPageUrlState({ runId, setRunId });

  const onClearCtoDemoAuditFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(CTO_DEMO_AUDIT_FILTER_QUERY_PARAM);
    const query = params.toString();

    router.replace(
      query.length > 0 ? `${GOVERNANCE_AUDIT_PATH}?${query}` : GOVERNANCE_AUDIT_PATH,
      { scroll: false },
    );
  }, [router, searchParams]);

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);

    try {
      const types = await getAuditEventTypes();
      setEventTypes(types);
    } catch {
      // Type load failures surface via query hook failure state when search runs.
    } finally {
      setLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    if (serverLoad.typesLoadFailure === null) {
      return;
    }

    void loadTypes();
  }, [loadTypes, serverLoad.typesLoadFailure]);

  const currentFilters = useCallback(
    (): AuditFilterFields => ({
      eventType,
      fromUtc,
      toUtc,
      correlationId,
      actorUserId,
      runId,
    }),
    [actorUserId, correlationId, eventType, fromUtc, runId, toUtc],
  );

  const resetFilterFields = useCallback(() => {
    setAuditDatePreset(null);
    setEventType("");
    setFromUtc("");
    setToUtc("");
    setCorrelationId("");
    setActorUserId("");
    setRunId("");
  }, []);

  const applyBuyerPolishedDateRangeFromEvents = useCallback(
    (occurredUtcValues: readonly string[]) => {
      if (!buyerPolishedShell || occurredUtcValues.length === 0) {
        return;
      }

      const sorted = [...occurredUtcValues].sort((a, b) => a.localeCompare(b));
      const firstUtc = sorted[0];
      const lastUtc = sorted[sorted.length - 1];

      if (firstUtc === undefined || lastUtc === undefined) {
        return;
      }

      setFromUtc(toDatetimeLocalInputValue(new Date(firstUtc)));
      setToUtc(toDatetimeLocalInputValue(new Date(lastUtc)));
    },
    [buyerPolishedShell],
  );

  const auditFiltersActive =
    eventType.trim().length > 0 ||
    fromUtc.trim().length > 0 ||
    toUtc.trim().length > 0 ||
    correlationId.trim().length > 0 ||
    actorUserId.trim().length > 0 ||
    runId.trim().length > 0 ||
    auditDatePreset !== null;

  return {
    advancedAuditFiltersOpen,
    setAdvancedAuditFiltersOpen,
    buyerPrimaryFiltersOpen,
    setBuyerPrimaryFiltersOpen,
    eventTypes,
    eventType,
    setEventType,
    fromUtc,
    setFromUtc,
    toUtc,
    setToUtc,
    correlationId,
    setCorrelationId,
    actorUserId,
    setActorUserId,
    runId,
    setRunId,
    loadingTypes,
    auditDatePreset,
    setAuditDatePreset,
    ctoDemoAuditFilterActive,
    onClearCtoDemoAuditFilter,
    auditFiltersActive,
    currentFilters,
    resetFilterFields,
    applyBuyerPolishedDateRangeFromEvents,
  };
}
