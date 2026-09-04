"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  rowMatchesFilters,
  type IntegrationEventOutboxDeadLetterRow,
} from "@/app/(operator)/internal/failed-integration-messages/_sections/integration-events-dlq-presentation";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { integrationEventsDlqListBlockedMessage } from "@/lib/integration-events-dlq-page-copy";
import {
  integrationEventsDlqClearFiltersHrefFromSearch,
  integrationEventsDlqEventTypeHrefFromSearch,
  integrationEventsDlqTenantHrefFromSearch,
  parseIntegrationEventsDlqEventTypeFromSearch,
  parseIntegrationEventsDlqTenantFromSearch,
} from "@/lib/internal/integration-events-dlq-filter-url";

export type IntegrationEventsDlqLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; rows: IntegrationEventOutboxDeadLetterRow[] }
  | { status: "blocked"; message: string };

const listPath = "/api/proxy/v1/admin/integration-outbox/dead-letters?maxRows=100";

export function useIntegrationEventsDlqLoader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEventType = parseIntegrationEventsDlqEventTypeFromSearch(searchParams.get("eventType"));
  const urlTenant = parseIntegrationEventsDlqTenantFromSearch(searchParams.get("tenant"));
  const [state, setState] = useState<IntegrationEventsDlqLoadState>({ status: "idle" });
  const [eventTypeFilter, setEventTypeFilter] = useState(urlEventType);
  const [tenantFilter, setTenantFilter] = useState(urlTenant);

  useEffect(() => {
    setEventTypeFilter(parseIntegrationEventsDlqEventTypeFromSearch(searchParams.get("eventType")));
  }, [searchParams]);

  useEffect(() => {
    setTenantFilter(parseIntegrationEventsDlqTenantFromSearch(searchParams.get("tenant")));
  }, [searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      let nextHref = integrationEventsDlqTenantHrefFromSearch(searchParams.toString(), tenantFilter);
      nextHref = integrationEventsDlqEventTypeHrefFromSearch(
        nextHref.includes("?") ? nextHref.split("?")[1] ?? "" : "",
        eventTypeFilter,
      );

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [eventTypeFilter, router, searchParams, tenantFilter]);

  const setEventTypeFilterAndUrl = useCallback(
    (value: string) => {
      setEventTypeFilter(value);
      router.replace(
        integrationEventsDlqEventTypeHrefFromSearch(searchParams.toString(), value),
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const setTenantFilterAndUrl = useCallback(
    (value: string) => {
      setTenantFilter(value);
      router.replace(integrationEventsDlqTenantHrefFromSearch(searchParams.toString(), value), { scroll: false });
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch(
        listPath,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );
      if (!response.ok) {
        setState({ status: "blocked", message: integrationEventsDlqListBlockedMessage(response.status) });
        return;
      }
      const rows = (await response.json()) as IntegrationEventOutboxDeadLetterRow[];
      setState({ status: "ready", rows });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      setState({ status: "blocked", message: `${integrationEventsDlqListBlockedMessage(0)} ${detail}`.trim() });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const eventTypeOptions = useMemo(() => {
    if (state.status !== "ready") return [] as string[];
    return [...new Set(state.rows.map((row) => row.eventType).filter((v): v is string => Boolean(v)))].sort();
  }, [state]);

  const filteredRows = useMemo(() => {
    if (state.status !== "ready") return [] as IntegrationEventOutboxDeadLetterRow[];
    return state.rows.filter((row) => rowMatchesFilters(row, eventTypeFilter, tenantFilter));
  }, [eventTypeFilter, state, tenantFilter]);

  const clearFilters = useCallback(() => {
    setEventTypeFilter("all");
    setTenantFilter("");
    router.replace(integrationEventsDlqClearFiltersHrefFromSearch(searchParams.toString()), { scroll: false });
  }, [router, searchParams]);

  return {
    state,
    load,
    eventTypeFilter,
    setEventTypeFilter: setEventTypeFilterAndUrl,
    tenantFilter,
    setTenantFilter: setTenantFilterAndUrl,
    eventTypeOptions,
    filteredRows,
    clearFilters,
  };
}
