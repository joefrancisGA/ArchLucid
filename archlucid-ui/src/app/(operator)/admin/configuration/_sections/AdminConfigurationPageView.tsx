"use client";

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

import { AdminConfigurationLintFindingList } from "./AdminConfigurationLintFindingList";
import { formatSources, normalizePath, sectionToTestIdSegment } from "./admin-configuration-helpers";
import type { AdminConfigurationPageViewModel } from "./admin-configuration-view-model";

type Props = {
  readonly model: AdminConfigurationPageViewModel;
};

export function AdminConfigurationPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
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
              value={m.search}
              onChange={(e) => {
                m.setSearch(e.target.value);
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
              value={m.sectionFilter}
              onValueChange={(v) => {
                m.setSectionFilter(v);
              }}
            >
              <SelectTrigger id="admin-config-section" className="w-56" data-testid="admin-configuration-section-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {m.sections.map((s) => {
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
            disabled={m.loadState === "loading" || m.lintState === "loading"}
            data-testid="admin-configuration-refresh"
            onClick={() => void m.refreshAll()}
          >
            {m.loadState === "loading" || m.lintState === "loading" ? "Refreshing…" : "Refresh"}
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
          {m.lintState === "loading" ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400" data-testid="admin-configuration-env-health-loading">
              Loading lint results…
            </p>
          ) : null}

          {m.lintState === "forbidden" ? (
            <p className="m-0 text-rose-800 dark:text-rose-200" role="alert" data-testid="admin-configuration-env-health-forbidden">
              Config lint requires tenant administrator access (same as the catalog summary above).
            </p>
          ) : null}

          {m.lintState === "error" ? (
            <p className="m-0 text-rose-800 dark:text-rose-200" role="alert" data-testid="admin-configuration-env-health-error">
              Could not load configuration lint. Check connectivity and try Refresh.
            </p>
          ) : null}

          {m.lintState === "empty" ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">No structured lint payload was returned.</p>
          ) : null}

          {m.lintState === "ok" && m.lint !== null ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">Hosting environment</span>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs dark:bg-neutral-900">
                  {normalizePath(m.lint.hostingEnvironmentName ?? "").length > 0 ? m.lint.hostingEnvironmentName : "—"}
                </span>
                <span
                  className={
                    m.lint.ok === true
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50"
                      : "rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-950 dark:bg-amber-950 dark:text-amber-50"
                  }
                  data-testid="admin-configuration-env-health-status"
                >
                  {m.lint.ok === true ? "No blocking findings" : "Blocking findings"}
                </span>
              </div>

              <div>
                <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Blocking</p>
                <AdminConfigurationLintFindingList rows={m.lint.blockingFindings} />
              </div>

              <div>
                <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Advisory</p>
                <AdminConfigurationLintFindingList rows={m.lint.advisoryFindings} />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {m.loadState === "forbidden" ? (
        <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert" data-testid="admin-configuration-forbidden">
          This page requires tenant administrator access (AdminAuthority). Sign in with an admin-ranked account or API key.
        </p>
      ) : null}

      {m.loadState === "error" ? (
        <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert" data-testid="admin-configuration-error">
          Could not load configuration summary. Check connectivity and try refresh.
        </p>
      ) : null}

      {m.loadState === "empty" ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" data-testid="admin-configuration-empty">
          No configuration keys were returned.
        </p>
      ) : null}

      {m.loadState === "ok" && m.filteredRows.length === 0 ? (
        <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" data-testid="admin-configuration-no-matches">
          No keys match the current search and category filters.
        </p>
      ) : null}

      {m.rowsBySection.map(({ section, items }) => {
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
