"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { OperationalErrorsDetailPanel } from "@/app/(operator)/internal/operational-errors/_sections/OperationalErrorsDetailPanel";
import { OperationalErrorsTable } from "@/app/(operator)/internal/operational-errors/_sections/OperationalErrorsTable";
import {
  buildOperationalErrorsTableClipboardText,
  rowMatchesOperationalErrorFilters,
  type OperationalErrorRow,
} from "@/app/(operator)/internal/operational-errors/_sections/operational-errors-presentation";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorLoadingNotice } from "@/components/operator/OperatorShellMessage";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshButton } from "@/components/ui/refresh-button";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTERNAL_OPERATIONAL_ERRORS_PATH } from "@/lib/internal-ops-route-paths";
import {
  operationalErrorsCategoryHrefFromSearch,
  operationalErrorsCorrelationHrefFromSearch,
  operationalErrorsStatusHrefFromSearch,
  operationalErrorsTenantHrefFromSearch,
  parseOperationalErrorsCategoryFromSearch,
  parseOperationalErrorsCorrelationFromSearch,
  parseOperationalErrorsStatusFromSearch,
  parseOperationalErrorsTenantFromSearch,
} from "@/lib/internal/operational-errors-filter-url";
import {
  operationalErrorsDetailHrefFromSearch,
  parseOperationalErrorsDetailIdFromSearch,
} from "@/lib/internal/operational-errors-detail-url";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; rows: OperationalErrorRow[] }
  | { status: "blocked"; message: string };

const listPath = "/api/proxy/v1/admin/operational-errors?maxRows=200";

const CATEGORY_CHIP_OPTIONS = [
  { value: "all", label: "All categories" },
  { value: "HttpError", label: "HttpError" },
  { value: "DatabaseError", label: "DatabaseError" },
  { value: "UnhandledException", label: "UnhandledException" },
] as const;

const STATUS_CHIP_OPTIONS = [
  { value: "all", label: "Any status" },
  { value: "400", label: "400+" },
  { value: "500", label: "500+" },
] as const;

/** Internal staff review for platform HTTP, database, and unhandled exceptions. */
export function OperationalErrorsPageClient() {
  const router = useRouter();
  const pathname = usePathname() ?? INTERNAL_OPERATIONAL_ERRORS_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const urlCategory = parseOperationalErrorsCategoryFromSearch(searchParams.get("category"));
  const urlStatus = parseOperationalErrorsStatusFromSearch(searchParams.get("status"));
  const urlTenant = parseOperationalErrorsTenantFromSearch(searchParams.get("tenant"));
  const urlCorrelation = parseOperationalErrorsCorrelationFromSearch(searchParams.get("correlation"));
  const urlErrorId = parseOperationalErrorsDetailIdFromSearch(searchParams.get("errorId"));

  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [categoryFilter, setCategoryFilter] = useState(urlCategory);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [tenantFilter, setTenantFilter] = useState(urlTenant);
  const [correlationFilter, setCorrelationFilter] = useState(urlCorrelation);
  const [selectedRow, setSelectedRowState] = useState<OperationalErrorRow | null>(null);

  const setSelectedRow = useCallback(
    (row: OperationalErrorRow | null) => {
      setSelectedRowState(row);
      router.replace(
        operationalErrorsDetailHrefFromSearch(currentSearch, row?.id ?? null, pathname),
        { scroll: false },
      );
    },
    [currentSearch, pathname, router],
  );

  useEffect(() => {
    if (state.status !== "ready" || urlErrorId.length === 0) {
      return;
    }

    const row = state.rows.find((candidate) => candidate.id === urlErrorId) ?? null;

    if (row === null) {
      return;
    }

    setSelectedRowState((current) => (current?.id === row.id ? current : row));
  }, [state, urlErrorId]);

  useEffect(() => {
    setCategoryFilter(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    setStatusFilter(urlStatus);
  }, [urlStatus]);

  useEffect(() => {
    setTenantFilter(urlTenant);
  }, [urlTenant]);

  useEffect(() => {
    setCorrelationFilter(urlCorrelation);
  }, [urlCorrelation]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      let nextHref = operationalErrorsTenantHrefFromSearch(searchParams.toString(), tenantFilter, pathname);
      nextHref = operationalErrorsCorrelationHrefFromSearch(
        nextHref.includes("?") ? nextHref.split("?")[1] ?? "" : "",
        correlationFilter,
        pathname,
      );

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [correlationFilter, pathname, router, searchParams, tenantFilter]);

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
          message: `Could not load operational errors (HTTP ${response.status}). ArchLucid vendor-staff authority is required.`,
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

  const onCategoryChange = useCallback(
    (category: string) => {
      setCategoryFilter(category);
      router.replace(operationalErrorsCategoryHrefFromSearch(currentSearch, category, pathname), { scroll: false });
    },
    [currentSearch, pathname, router],
  );

  const onStatusChange = useCallback(
    (status: string) => {
      setStatusFilter(status);
      router.replace(operationalErrorsStatusHrefFromSearch(currentSearch, status, pathname), { scroll: false });
    },
    [currentSearch, pathname, router],
  );

  const onCopyTable = useCallback(async () => {
    if (filteredRows.length === 0) {
      return;
    }

    const clipboardText = buildOperationalErrorsTableClipboardText(filteredRows);

    try {
      await navigator.clipboard.writeText(clipboardText);
      showSuccess(
        filteredRows.length === 1
          ? "Copied 1 operational error row to the clipboard."
          : `Copied ${filteredRows.length} operational error rows to the clipboard.`,
      );
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "Clipboard is unavailable in this browser.";
      showError("Could not copy table", detail);
    }
  }, [filteredRows]);

  return (
    <OperatorPageContainer>
      <OperatorPageHeader
        title="Operational errors"
        subtitle="Review captured HTTP errors, database failures, and unhandled exceptions across the platform."
        navHref={INTERNAL_OPERATIONAL_ERRORS_PATH}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={state.status !== "ready" || filteredRows.length === 0}
              data-testid="operational-errors-copy-table"
              onClick={() => {
                void onCopyTable();
              }}
            >
              <Copy className="size-3.5 shrink-0" aria-hidden />
              Copy table
            </Button>
            <RefreshButton onClick={() => void load()} busy={state.status === "loading"} />
          </div>
        }
      />

      <Card className={DESIGN_TOKENS.surface.card}>
        <CardHeader className="space-y-1 pb-3">
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Filters</CardTitle>
          <CardDescription className={OPERATOR_TYPOGRAPHY.helper}>
            Rows are retained for 90 days. Use correlation ID to join audit and trace evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Category</p>
            <FilterChipGroup aria-label="Filter operational errors by category" className="flex flex-wrap gap-2">
              {CATEGORY_CHIP_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  href={operationalErrorsCategoryHrefFromSearch(currentSearch, option.value, pathname)}
                  scroll={false}
                  className={buyerFilterChipClass(categoryFilter === option.value, false)}
                  aria-current={categoryFilter === option.value ? "page" : undefined}
                  data-testid={`operational-errors-category-${option.value}`}
                  onClick={() => onCategoryChange(option.value)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterChipGroup>
          </div>
          <div className="space-y-2">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Minimum status</p>
            <FilterChipGroup aria-label="Filter operational errors by status" className="flex flex-wrap gap-2">
              {STATUS_CHIP_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  href={operationalErrorsStatusHrefFromSearch(currentSearch, option.value, pathname)}
                  scroll={false}
                  className={buyerFilterChipClass(statusFilter === option.value, false)}
                  aria-current={statusFilter === option.value ? "page" : undefined}
                  data-testid={`operational-errors-status-${option.value}`}
                  onClick={() => onStatusChange(option.value)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </FilterChipGroup>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
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
