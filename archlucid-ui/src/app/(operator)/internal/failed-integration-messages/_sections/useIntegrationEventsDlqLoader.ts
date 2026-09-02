"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  rowMatchesFilters,
  type IntegrationEventOutboxDeadLetterRow,
} from "@/app/(operator)/internal/failed-integration-messages/_sections/integration-events-dlq-presentation";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { integrationEventsDlqListBlockedMessage } from "@/lib/integration-events-dlq-page-copy";

export type IntegrationEventsDlqLoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; rows: IntegrationEventOutboxDeadLetterRow[] }
  | { status: "blocked"; message: string };

const listPath = "/api/proxy/v1/admin/integration-outbox/dead-letters?maxRows=100";

export function useIntegrationEventsDlqLoader() {
  const [state, setState] = useState<IntegrationEventsDlqLoadState>({ status: "idle" });
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("");

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

  const clearFilters = useCallback(() => { setEventTypeFilter("all"); setTenantFilter(""); }, []);

  return { state, load, eventTypeFilter, setEventTypeFilter, tenantFilter, setTenantFilter, eventTypeOptions, filteredRows, clearFilters };
}
