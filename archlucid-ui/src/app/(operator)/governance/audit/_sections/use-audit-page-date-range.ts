"use client";

import type { Dispatch, SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import { auditTrailDateRangePresetHrefFromSearch, parseAuditTrailDateRangePresetFromSearch } from "@/lib/governance/audit-trail-date-range-url";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";

import type { AuditFilterFields } from "./audit-page-helpers";
import { toDatetimeLocalInputValue } from "./audit-page-helpers";
import { shouldInjectAuditDemoOnSearchError } from "./resolve-audit-search-page-for-ui";

type UseAuditPageDateRangeOptions = {
  readonly buyerPolishedShell: boolean;
  readonly events: readonly AuditEvent[];
  readonly eventType: string;
  readonly correlationId: string;
  readonly actorUserId: string;
  readonly runId: string;
  readonly setFromUtc: Dispatch<SetStateAction<string>>;
  readonly setToUtc: Dispatch<SetStateAction<string>>;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
  readonly setSearching: Dispatch<SetStateAction<boolean>>;
  readonly executeSearch: (
    filters: AuditFilterFields,
    loadMoreCursor?: string | null,
  ) => Promise<CursorPagedResponse<AuditEvent>>;
  readonly applySearchPageToState: (
    page: CursorPagedResponse<AuditEvent>,
    filters: AuditFilterFields,
  ) => void;
  readonly applyDemoAuditFallback: () => void;
};

export function useAuditPageDateRange(options: UseAuditPageDateRangeOptions) {
  const {
    buyerPolishedShell,
    events,
    eventType,
    correlationId,
    actorUserId,
    runId,
    setFromUtc,
    setToUtc,
    setFailure,
    setSearching,
    executeSearch,
    applySearchPageToState,
    applyDemoAuditFallback,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlDatePreset = parseAuditTrailDateRangePresetFromSearch(searchParams.get("range"));
  const [auditDatePreset, setAuditDatePreset] = useState<null | "24h" | "7d">(urlDatePreset);

  useEffect(() => {
    setAuditDatePreset(urlDatePreset);

    if (urlDatePreset === null) {
      return;
    }

    const hours = urlDatePreset === "24h" ? 24 : 168;
    const fromStr = toDatetimeLocalInputValue(new Date(Date.now() - hours * 3600 * 1000));

    setFromUtc(fromStr);
    setToUtc("");
  }, [setFromUtc, setToUtc, urlDatePreset]);

  useEffect(() => {
    if (!buyerPolishedShell || events.length === 0) {
      return;
    }

    const sorted = [...events].map((e) => e.occurredUtc).sort((a, b) => a.localeCompare(b));
    const firstUtc = sorted[0];
    const lastUtc = sorted[sorted.length - 1];

    if (firstUtc === undefined || lastUtc === undefined) {
      return;
    }

    setFromUtc(toDatetimeLocalInputValue(new Date(firstUtc)));
    setToUtc(toDatetimeLocalInputValue(new Date(lastUtc)));
  }, [buyerPolishedShell, events, setFromUtc, setToUtc]);

  const runDateRangeSearch = useCallback(
    async (fromUtc: string, toUtc: string) => {
      setFailure(null);
      setSearching(true);

      const filters: AuditFilterFields = {
        eventType,
        fromUtc,
        toUtc,
        correlationId,
        actorUserId,
        runId,
      };

      try {
        const page = await executeSearch(filters);

        applySearchPageToState(page, filters);
      } catch (e) {
        if (shouldInjectAuditDemoOnSearchError(filters)) {
          applyDemoAuditFallback();
        } else {
          setFailure(toApiLoadFailure(e));
        }
      } finally {
        setSearching(false);
      }
    },
    [
      actorUserId,
      applyDemoAuditFallback,
      applySearchPageToState,
      correlationId,
      eventType,
      executeSearch,
      runId,
      setFailure,
      setSearching,
    ],
  );

  const applyAuditDatePreset = useCallback(
    async (preset: "24h" | "7d") => {
      const hours = preset === "24h" ? 24 : 168;
      const fromStr = toDatetimeLocalInputValue(new Date(Date.now() - hours * 3600 * 1000));

      setAuditDatePreset(preset);
      setFromUtc(fromStr);
      setToUtc("");
      router.replace(
        auditTrailDateRangePresetHrefFromSearch(searchParams.toString(), preset, pathname ?? GOVERNANCE_AUDIT_PATH),
        { scroll: false },
      );
      await runDateRangeSearch(fromStr, "");
    },
    [pathname, router, runDateRangeSearch, searchParams, setFromUtc, setToUtc],
  );

  const clearDateRangeAndSearch = useCallback(async () => {
    setAuditDatePreset(null);
    setFromUtc("");
    setToUtc("");
    router.replace(
      auditTrailDateRangePresetHrefFromSearch(searchParams.toString(), null, pathname ?? GOVERNANCE_AUDIT_PATH),
      { scroll: false },
    );
    await runDateRangeSearch("", "");
  }, [pathname, router, runDateRangeSearch, searchParams, setFromUtc, setToUtc]);

  return {
    auditDatePreset,
    setAuditDatePreset,
    applyAuditDatePreset,
    clearDateRangeAndSearch,
  };
}
