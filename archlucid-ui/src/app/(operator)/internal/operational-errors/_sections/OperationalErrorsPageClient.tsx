"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { OperationalErrorsDetailPanel } from "@/app/(operator)/internal/operational-errors/_sections/OperationalErrorsDetailPanel";
import { OperationalErrorsTable } from "@/app/(operator)/internal/operational-errors/_sections/OperationalErrorsTable";
import {
  rowMatchesOperationalErrorFilters,
  type OperationalErrorRow,
} from "@/app/(operator)/internal/operational-errors/_sections/operational-errors-presentation";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshButton } from "@/components/ui/refresh-button";
import { INTERNAL_OPERATIONAL_ERRORS_PATH } from "@/lib/internal-ops-route-paths";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; rows: OperationalErrorRow[] }
  | { status: "blocked"; message: string };

const listPath = "/api/proxy/v1/admin/operational-errors?maxRows=200";

/** Internal staff review for platform HTTP, database, and unhandled exceptions. */
export function OperationalErrorsPageClient() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("");
  const [correlationFilter, setCorrelationFilter] = useState("");
  const [selectedRow, setSelectedRow] = useState<OperationalErrorRow | null>(null);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const response = await fetch(
        listPath,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!response.ok) {
        setState({
          status: "blocked",
          message: `Could not load operational errors (HTTP ${response.status}). Admin authority is required.`,
        });

        return;
      }

      const rows = (await response.json()) as OperationalErrorRow[];
      setState({ status: "ready", rows });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      setState({ status: "blocked", message: detail });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    if (state.status !== "ready")
      return [];

    return state.rows.filter((row) =>
      rowMatchesOperationalErrorFilters(row, categoryFilter, statusFilter, tenantFilter, correlationFilter),
    );
  }, [state, categoryFilter, statusFilter, tenantFilter, correlationFilter]);

  return (
    <OperatorPageContainer>
      <OperatorPageHeader
        title="Operational errors"
        subtitle="Review captured HTTP errors, database failures, and unhandled exceptions across the platform."
        navHref={INTERNAL_OPERATIONAL_ERRORS_PATH}
        actions={<RefreshButton onClick={() => void load()} />}
      />

      <Card className={DESIGN_TOKENS.surface.card}>
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Filters</CardTitle>
          <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
            Rows are retained for 90 days. Use correlation ID to join audit and trace evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="operational-errors-category">Category</Label>
            <select
              id="operational-errors-category"
              className={cn("h-9 w-full rounded-md border border-al-border-subtle bg-al-surface px-2", OPERATOR_TYPOGRAPHY.helper)}
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              <option value="HttpError">HttpError</option>
              <option value="DatabaseError">DatabaseError</option>
              <option value="UnhandledException">UnhandledException</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="operational-errors-status">Minimum status</Label>
            <select
              id="operational-errors-status"
              className={cn("h-9 w-full rounded-md border border-al-border-subtle bg-al-surface px-2", OPERATOR_TYPOGRAPHY.helper)}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Any status</option>
              <option value="400">400+</option>
              <option value="500">500+</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="operational-errors-tenant">Tenant ID contains</Label>
            <Input
              id="operational-errors-tenant"
              value={tenantFilter}
              onChange={(event) => setTenantFilter(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="operational-errors-correlation">Correlation ID contains</Label>
            <Input
              id="operational-errors-correlation"
              value={correlationFilter}
              onChange={(event) => setCorrelationFilter(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {state.status === "idle" ? (
        <OperatorLoadingNotice>Load operational errors to begin review.</OperatorLoadingNotice>
      ) : null}

      {state.status === "loading" ? <OperatorLoadingNotice>Loading operational errors…</OperatorLoadingNotice> : null}

      {state.status === "blocked" ? <OperatorApiProblem problem={null} fallbackMessage={state.message} /> : null}

      {state.status === "ready" && filteredRows.length === 0 ? (
        <EnterpriseCompactEmptyState
          title="No matching operational errors"
          description="Try refreshing or relaxing filters. Errors appear after API traffic produces HTTP 4xx/5xx or exceptions."
        />
      ) : null}

      {state.status === "ready" && filteredRows.length > 0 ? (
        <div className="space-y-4">
          <OperationalErrorsTable
            rows={filteredRows}
            selectedId={selectedRow?.id ?? null}
            onSelect={setSelectedRow}
          />
          <OperationalErrorsDetailPanel row={selectedRow} onClose={() => setSelectedRow(null)} />
        </div>
      ) : null}
    </OperatorPageContainer>
  );
}
