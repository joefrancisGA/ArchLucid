"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import { getAuditEventTypes } from "@/lib/api";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import {
  auditTrailActionHrefFromSearch,
  auditTrailActorHrefFromSearch,
  auditTrailClearFiltersHrefFromSearch,
  auditTrailSearchHrefFromSearch,
  parseAuditTrailActionFromSearch,
  parseAuditTrailActorFromSearch,
  parseAuditTrailSearchQueryFromSearch,
} from "@/lib/governance/audit-trail-filters-url";
import {
  auditTrailRunIdHrefFromSearch,
  parseAuditTrailRunIdFromSearch,
} from "@/lib/governance/audit-trail-run-id-url";
import {
  auditTrailFiltersDisclosureHrefFromSearch,
  parseAuditTrailAdvancedFiltersOpenFromSearch,
  parseAuditTrailPrimaryFiltersOpenFromSearch,
} from "@/lib/governance/audit-trail-filters-disclosure-url";
import {
  auditTrailCustomDateHrefFromSearch,
  parseAuditTrailCustomDateFromSearch,
} from "@/lib/governance/audit-trail-custom-date-url";
import { parseAuditTrailDateRangePresetFromSearch } from "@/lib/governance/audit-trail-date-range-url";

import type { AuditPageServerLoad } from "./load-audit-page-data";
import type { AuditFilterFields } from "./audit-page-helpers";
import { useAuditPageUrlState } from "./use-audit-page-url-state";
import { useAuditPageCtoDemoFilter } from "./use-audit-page-cto-demo-filter";
import { useAuditPageDateRange } from "./use-audit-page-date-range";
import { useAuditPageSearchQuery } from "./use-audit-page-search-query";
import { shouldInjectAuditDemoOnSearchError } from "./resolve-audit-search-page-for-ui";

export type UseAuditPageSearchResult = {
  readonly runId: string;
  readonly failure: ApiLoadFailureState | null;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
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
  readonly setRunId: Dispatch<SetStateAction<string>>;
  readonly searching: boolean;
  readonly lastRefreshedAt: Date | null;
  readonly loadingTypes: boolean;
  readonly auditDatePreset: null | "24h" | "7d";
  readonly applyAuditDatePreset: (preset: "24h" | "7d") => Promise<void>;
  readonly clearDateRangeAndSearch: () => Promise<void>;
  readonly runSearch: () => Promise<void>;
  readonly clearFiltersAndSearch: () => Promise<void>;
  readonly events: AuditEvent[];
  readonly hasMoreResults: boolean;
  readonly loadingMore: boolean;
  readonly loadMore: () => Promise<void>;
  readonly ctoDemoAuditFilterActive: boolean;
  readonly onClearCtoDemoAuditFilter: () => void;
  readonly auditFiltersActive: boolean;
  readonly currentFilters: () => AuditFilterFields;
  readonly executeSearch: (filters: AuditFilterFields, loadMoreCursor?: string | null) => Promise<CursorPagedResponse<AuditEvent>>;
  readonly applySearchPageToState: (page: CursorPagedResponse<AuditEvent>, filters: AuditFilterFields) => void;
  readonly applyDemoAuditFallback: () => void;
  readonly setSearching: Dispatch<SetStateAction<boolean>>;
  readonly setAuditDatePreset: Dispatch<SetStateAction<null | "24h" | "7d">>;
};

export function useAuditPageSearch(
  serverLoad: AuditPageServerLoad,
  buyerPolishedShell: boolean,
): UseAuditPageSearchResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlAction = parseAuditTrailActionFromSearch(searchParams.get("action"));
  const urlActor = parseAuditTrailActorFromSearch(searchParams.get("actor"));
  const urlSearchQuery = parseAuditTrailSearchQueryFromSearch(searchParams.get("q"));
  const urlDatePreset = parseAuditTrailDateRangePresetFromSearch(searchParams.get("range"));
  const urlFromUtc = parseAuditTrailCustomDateFromSearch(searchParams.get("from"));
  const urlToUtc = parseAuditTrailCustomDateFromSearch(searchParams.get("to"));
  const urlAdvancedOpen = parseAuditTrailAdvancedFiltersOpenFromSearch(searchParams.get("advanced"));
  const urlPrimaryFiltersOpen = parseAuditTrailPrimaryFiltersOpenFromSearch(searchParams.get("primaryFilters"));

  const [advancedAuditFiltersOpen, setAdvancedAuditFiltersOpenState] = useState(
    buyerPolishedShell ? urlAdvancedOpen : true,
  );
  const [buyerPrimaryFiltersOpen, setBuyerPrimaryFiltersOpenState] = useState(urlPrimaryFiltersOpen);
  const [eventTypes, setEventTypes] = useState<string[]>(serverLoad.eventTypes);
  const [eventType, setEventType] = useState<string>(urlAction);
  const [fromUtc, setFromUtc] = useState<string>(urlDatePreset === null ? urlFromUtc : "");
  const [toUtc, setToUtc] = useState<string>(urlDatePreset === null ? urlToUtc : "");
  const [correlationId, setCorrelationId] = useState<string>(urlSearchQuery);
  const [actorUserId, setActorUserId] = useState<string>(urlActor);
  const [runId, setRunId] = useState<string>(() => parseAuditTrailRunIdFromSearch(searchParams.get("runId")));
  const [loadingTypes, setLoadingTypes] = useState(serverLoad.typesLoadFailure !== null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const syncFiltersDisclosureToUrl = useCallback(
    (patch: { readonly advancedAuditFiltersOpen?: boolean; readonly buyerPrimaryFiltersOpen?: boolean }) => {
      router.replace(
        auditTrailFiltersDisclosureHrefFromSearch(searchParams.toString(), patch, pathname ?? GOVERNANCE_AUDIT_PATH),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setAdvancedAuditFiltersOpen: Dispatch<SetStateAction<boolean>> = useCallback(
    (next) => {
      setAdvancedAuditFiltersOpenState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        syncFiltersDisclosureToUrl({ advancedAuditFiltersOpen: resolved });

        return resolved;
      });
    },
    [syncFiltersDisclosureToUrl],
  );

  const setBuyerPrimaryFiltersOpen: Dispatch<SetStateAction<boolean>> = useCallback(
    (next) => {
      setBuyerPrimaryFiltersOpenState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        syncFiltersDisclosureToUrl({ buyerPrimaryFiltersOpen: resolved });

        return resolved;
      });
    },
    [syncFiltersDisclosureToUrl],
  );

  useEffect(() => {
    if (buyerPolishedShell) {
      setAdvancedAuditFiltersOpenState(parseAuditTrailAdvancedFiltersOpenFromSearch(searchParams.get("advanced")));
    }

    setBuyerPrimaryFiltersOpenState(parseAuditTrailPrimaryFiltersOpenFromSearch(searchParams.get("primaryFilters")));
  }, [buyerPolishedShell, searchParams]);

  const { ctoDemoAuditFilterActive, onClearCtoDemoAuditFilter } = useAuditPageCtoDemoFilter();

  useAuditPageUrlState({ runId, setRunId });

  useEffect(() => {
    setEventType(urlAction);
  }, [urlAction]);

  useEffect(() => {
    setActorUserId(urlActor);
  }, [urlActor]);

  useEffect(() => {
    setCorrelationId(urlSearchQuery);
  }, [urlSearchQuery]);

  useEffect(() => {
    setRunId(parseAuditTrailRunIdFromSearch(searchParams.get("runId")));
  }, [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = auditTrailRunIdHrefFromSearch(
        searchParams.toString(),
        runId,
        pathname ?? GOVERNANCE_AUDIT_PATH,
      );

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [pathname, router, runId, searchParams]);

  useEffect(() => {
    if (urlDatePreset !== null) {
      return;
    }

    setFromUtc(urlFromUtc);
    setToUtc(urlToUtc);
  }, [urlDatePreset, urlFromUtc, urlToUtc]);

  useEffect(() => {
    if (urlDatePreset !== null) {
      return;
    }

    const handle = window.setTimeout(() => {
      const nextHref = auditTrailCustomDateHrefFromSearch(
        searchParams.toString(),
        fromUtc,
        toUtc,
        pathname ?? GOVERNANCE_AUDIT_PATH,
      );

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [fromUtc, pathname, router, searchParams, toUtc, urlDatePreset]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      let nextHref = auditTrailActionHrefFromSearch(searchParams.toString(), eventType, pathname ?? GOVERNANCE_AUDIT_PATH);
      nextHref = auditTrailActorHrefFromSearch(
        nextHref.includes("?") ? nextHref.split("?")[1] ?? "" : "",
        actorUserId,
        pathname ?? GOVERNANCE_AUDIT_PATH,
      );
      nextHref = auditTrailSearchHrefFromSearch(
        nextHref.includes("?") ? nextHref.split("?")[1] ?? "" : "",
        correlationId,
        pathname ?? GOVERNANCE_AUDIT_PATH,
      );

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [actorUserId, correlationId, eventType, pathname, router, searchParams]);

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true);
    setFailure(null);

    try {
      const types = await getAuditEventTypes();
      setEventTypes(types);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
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

  const query = useAuditPageSearchQuery({
    runId,
    currentFilters,
    setFailure,
    pathname: pathname ?? GOVERNANCE_AUDIT_PATH,
    searchParams,
    router,
  });

  const dateRange = useAuditPageDateRange({
    buyerPolishedShell,
    events: query.events,
    eventType,
    correlationId,
    actorUserId,
    runId,
    setFromUtc,
    setToUtc,
    setFailure,
    setSearching: query.setSearching,
    executeSearch: query.executeSearch,
    applySearchPageToState: query.applySearchPageToState,
    applyDemoAuditFallback: query.applyDemoAuditFallback,
  });

  const clearFiltersAndSearch = useCallback(async () => {
    dateRange.setAuditDatePreset(null);
    setEventType("");
    setFromUtc("");
    setToUtc("");
    setCorrelationId("");
    setActorUserId("");
    setRunId("");
    router.replace(auditTrailClearFiltersHrefFromSearch(searchParams.toString(), pathname ?? GOVERNANCE_AUDIT_PATH), {
      scroll: false,
    });
    query.setSearching(true);
    setFailure(null);

    const empty: AuditFilterFields = {
      eventType: "",
      fromUtc: "",
      toUtc: "",
      correlationId: "",
      actorUserId: "",
      runId: "",
    };

    try {
      const page = await query.executeSearch(empty);

      query.applySearchPageToState(page, empty);
    } catch (e) {
      if (shouldInjectAuditDemoOnSearchError(empty)) {
        query.applyDemoAuditFallback();
      } else {
        setFailure(toApiLoadFailure(e));
      }
    } finally {
      query.setSearching(false);
    }
  }, [dateRange, pathname, query, router, searchParams]);

  const auditFiltersActive =
    eventType.trim().length > 0 ||
    fromUtc.trim().length > 0 ||
    toUtc.trim().length > 0 ||
    correlationId.trim().length > 0 ||
    actorUserId.trim().length > 0 ||
    runId.trim().length > 0 ||
    dateRange.auditDatePreset !== null;

  return {
    runId,
    failure,
    setFailure,
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
    setRunId,
    searching: query.searching,
    lastRefreshedAt: query.lastRefreshedAt,
    loadingTypes,
    auditDatePreset: dateRange.auditDatePreset,
    applyAuditDatePreset: dateRange.applyAuditDatePreset,
    clearDateRangeAndSearch: dateRange.clearDateRangeAndSearch,
    runSearch: query.runSearch,
    clearFiltersAndSearch,
    events: query.events,
    hasMoreResults: query.hasMoreResults,
    loadingMore: query.loadingMore,
    loadMore: query.loadMore,
    ctoDemoAuditFilterActive,
    onClearCtoDemoAuditFilter,
    auditFiltersActive,
    currentFilters,
    executeSearch: query.executeSearch,
    applySearchPageToState: query.applySearchPageToState,
    applyDemoAuditFallback: query.applyDemoAuditFallback,
    setSearching: query.setSearching,
    setAuditDatePreset: dateRange.setAuditDatePreset,
  };
}
