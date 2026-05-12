"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ContextualHelp } from "@/components/ContextualHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import type { components } from "@archlucid/api-types";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

const SUMMARY_PATH = "/api/proxy/v1/admin/configuration/summary?includeEffectiveValues=true";
const CONFIG_LINT_PATH = "/api/proxy/v1/admin/config-lint?includeAdvisory=true";

type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];

type AdminConfigLintFinding = components["schemas"]["AdminConfigLintFinding"];
type AdminConfigLintResponse = components["schemas"]["AdminConfigLintResponse"];

type LoadState = "idle" | "loading" | "ok" | "forbidden" | "error" | "empty";

function normalizePath(s: string | null | undefined): string {
  if (s === null || s === undefined) {
    return "";
  }

  return s;
}

/**
 * Read-only catalog-aligned configuration summary (effective values redacted for sensitive keys on the API) plus structured
 * config lint from GET /v1/admin/config-lint.
 */
export default function AdminConfigurationPage() {
  const isDemo = isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [rows, setRows] = useState<ConfigSummaryKeyRow[]>([]);
  const [lintState, setLintState] = useState<LoadState>("idle");
  const [lint, setLint] = useState<AdminConfigLintResponse | null>(null);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("__all__");

  const load = useCallback(async () => {
    setLoadState("loading");

    try {
      const res = await fetch(
        SUMMARY_PATH,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (res.status === 403) {
        setRows([]);
        setLoadState("forbidden");

        return;
      }

      if (!res.ok) {
        setRows([]);
        setLoadState("error");

        return;
      }

      const json: unknown = await res.json();
      const parsed = parseSummaryPayload(json);

      if (parsed.length === 0) {
        setRows([]);
        setLoadState("empty");

        return;
      }

      setRows(parsed);
      setLoadState("ok");
    } catch {
      setRows([]);
      setLoadState("error");
    }
  }, []);

  const loadLint = useCallback(async () => {
    setLintState("loading");

    try {
      const res = await fetch(
        CONFIG_LINT_PATH,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (res.status === 403) {
        setLint(null);
        setLintState("forbidden");

        return;
      }

      if (!res.ok) {
        setLint(null);
        setLintState("error");

        return;
      }

      const json: unknown = await res.json();
      const parsed: AdminConfigLintResponse | null = parseConfigLintPayload(json);

      if (parsed === null) {
        setLint(null);
        setLintState("empty");

        return;
      }

      setLint(parsed);
      setLintState("ok");
    } catch {
      setLint(null);
      setLintState("error");
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([load(), loadLint()]);
  }, [load, loadLint]);

  useEffect(() => {
    if (isDemo) {
      return;
    }

    void load();
    void loadLint();
  }, [isDemo, load, loadLint]);

  const sections = useMemo(() => {
    const set = new Set<string>();

    for (const r of rows) {
      const sec = normalizePath(r.section);

      if (sec.length > 0) {
        set.add(sec);
      }
    }

    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      const path = normalizePath(r.configPath).toLowerCase();
      const sec = normalizePath(r.section);

      if (sectionFilter !== "__all__" && sec !== sectionFilter) {
        return false;
      }

      if (q.length === 0) {
        return true;
      }

      return path.includes(q);
    });
  }, [rows, search, sectionFilter]);

  const rowsBySection = useMemo(() => {
    const map = new Map<string, ConfigSummaryKeyRow[]>();

    for (const r of filteredRows) {
      const sec = normalizePath(r.section).length > 0 ? normalizePath(r.section) : "Other";

      if (!map.has(sec)) {
        map.set(sec, []);
      }

      map.get(sec)!.push(r);
    }

    const keys = [...map.keys()].sort((a, b) => a.localeCompare(b));
    const ordered: { section: string; items: ConfigSummaryKeyRow[] }[] = [];

    for (const k of keys) {
      const items = map.get(k) ?? [];

      items.sort((a, b) => normalizePath(a.configPath).localeCompare(normalizePath(b.configPath)));
      ordered.push({ section: k, items });
    }

    return ordered;
  }, [filteredRows]);

  if (isDemo) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Configuration summary not available in demo mode.</p>
        <p className="m-0 mt-1">Catalog-aligned settings require a live API session with admin access.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="admin-configuration-page">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Configuration summary</h1>
          <ContextualHelp helpKey="admin-configuration" />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Effective values for non-sensitive keys; secrets and connection material are masked by the API.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-config-search">Search by key path</Label>
            <Input
              id="admin-config-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="e.g. ArchLucid:StorageProvider"
              className="w-72 max-w-full"
              autoComplete="off"
              data-testid="admin-configuration-search"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-config-section">Category</Label>
            <Select
              value={sectionFilter}
              onValueChange={(v) => {
                setSectionFilter(v);
              }}
            >
              <SelectTrigger id="admin-config-section" className="w-56" data-testid="admin-configuration-section-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {sections.map((s) => {
                  return (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loadState === "loading" || lintState === "loading"}
            data-testid="admin-configuration-refresh"
            onClick={() => void refreshAll()}
          >
            {loadState === "loading" || lintState === "loading" ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <Card data-testid="admin-configuration-env-health">
        <CardHeader>
          <CardTitle className="text-base">Environment health (config lint)</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            Parity with <span className="font-mono">archlucid config lint</span> plus hosting advisor warnings (
            <span className="font-mono">includeAdvisory=true</span>). Blocking issues match fail-fast startup traps; no
            secrets appear in this view.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-neutral-800 dark:text-neutral-200">
          {lintState === "loading" ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400" data-testid="admin-configuration-env-health-loading">
              Loading lint results…
            </p>
          ) : null}

          {lintState === "forbidden" ? (
            <p className="m-0 text-rose-800 dark:text-rose-200" role="alert" data-testid="admin-configuration-env-health-forbidden">
              Config lint requires tenant administrator access (same as the catalog summary above).
            </p>
          ) : null}

          {lintState === "error" ? (
            <p className="m-0 text-rose-800 dark:text-rose-200" role="alert" data-testid="admin-configuration-env-health-error">
              Could not load configuration lint. Check connectivity and try Refresh.
            </p>
          ) : null}

          {lintState === "empty" ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">No structured lint payload was returned.</p>
          ) : null}

          {lintState === "ok" && lint !== null ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">Hosting environment</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-900">
                  {normalizePath(lint.hostingEnvironmentName ?? "").length > 0 ? lint.hostingEnvironmentName : "—"}
                </span>
                <span
                  className={
                    lint.ok === true
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50"
                      : "rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-950 dark:bg-amber-950 dark:text-amber-50"
                  }
                  data-testid="admin-configuration-env-health-status"
                >
                  {lint.ok === true ? "No blocking findings" : "Blocking findings"}
                </span>
              </div>

              <div>
                <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Blocking</p>
                {renderLintFindingList(lint.blockingFindings)}
              </div>

              <div>
                <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Advisory</p>
                {renderLintFindingList(lint.advisoryFindings)}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {loadState === "forbidden" ? (
        <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert" data-testid="admin-configuration-forbidden">
          This page requires tenant administrator access (AdminAuthority). Sign in with an admin-ranked account or API key.
        </p>
      ) : null}

      {loadState === "error" ? (
        <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert" data-testid="admin-configuration-error">
          Could not load configuration summary. Check connectivity and try refresh.
        </p>
      ) : null}

      {loadState === "empty" ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" data-testid="admin-configuration-empty">
          No configuration keys were returned.
        </p>
      ) : null}

      {loadState === "ok" && filteredRows.length === 0 ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" data-testid="admin-configuration-no-matches">
          No keys match the current search and category filters.
        </p>
      ) : null}

      {rowsBySection.map(({ section, items }) => {
        return (
          <Card key={section}>
            <CardHeader>
              <CardTitle className="text-base">{section}</CardTitle>
              <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">{items.length} key(s) in this category</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table
                  className="w-full text-left text-sm"
                  data-testid={`admin-configuration-table-${sectionToTestIdSegment(section)}`}
                >
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
                      <th className="py-2 pr-3">Key path</th>
                      <th className="py-2 pr-3">Set</th>
                      <th className="py-2 pr-3">Sources (catalog)</th>
                      <th className="py-2 pr-3">Effective value</th>
                      <th className="py-2 pr-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => {
                      const setLabel = row.isSet === true ? "Yes" : "No";
                      const sources = formatSources(row.sources);
                      const ev = row.effectiveValue ?? "—";
                      const desc = normalizePath(row.description).length > 0 ? row.description : "—";
                      const pathKey = normalizePath(row.configPath).length > 0 ? row.configPath : "—";

                      return (
                        <tr key={pathKey} className="border-b border-neutral-100 dark:border-neutral-800">
                          <td className="py-2 pr-3 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                            {normalizePath(row.configPath).length > 0 ? row.configPath : "—"}
                          </td>
                          <td className="py-2 pr-3 text-neutral-700 dark:text-neutral-300">{setLabel}</td>
                          <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-400">{sources}</td>
                          <td className="py-2 pr-3 font-mono text-xs text-neutral-800 dark:text-neutral-200">{ev}</td>
                          <td className="py-2 pr-3 text-neutral-600 dark:text-neutral-400">{desc}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function renderLintFindingList(rows: AdminConfigLintFinding[] | null | undefined) {
  const items = rows ?? [];

  if (items.length === 0) {
    return <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">None.</p>;
  }

  return (
    <ul className="m-0 mt-1 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300">
      {items.map((f, i) => {
        const rule = normalizePath(f.ruleName).length > 0 ? normalizePath(f.ruleName) : "—";
        const msg = normalizePath(f.message).length > 0 ? normalizePath(f.message) : "—";

        return (
          <li key={`${rule}-${i}`}>
            <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">{rule}</span>
            <span className="mx-1 text-neutral-400">—</span>
            <span>{msg}</span>
          </li>
        );
      })}
    </ul>
  );
}

function parseConfigLintPayload(json: unknown): AdminConfigLintResponse | null {
  if (typeof json !== "object" || json === null || !("ok" in json)) {
    return null;
  }

  const rec = json as { ok?: unknown };

  if (typeof rec.ok !== "boolean") {
    return null;
  }

  return json as AdminConfigLintResponse;
}

function parseSummaryPayload(json: unknown): ConfigSummaryKeyRow[] {
  if (typeof json !== "object" || json === null || !("keys" in json)) {
    return [];
  }

  const keysVal = (json as { keys?: unknown }).keys;

  if (!Array.isArray(keysVal)) {
    return [];
  }

  return keysVal.filter((k): k is ConfigSummaryKeyRow => typeof k === "object" && k !== null);
}

function formatSources(sources: string[] | null | undefined): string {
  if (sources === null || sources === undefined || sources.length === 0) {
    return "—";
  }

  return sources.join(", ");
}

function sectionToTestIdSegment(section: string): string {
  return section
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
