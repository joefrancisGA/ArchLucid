"use client";

import { cn } from "@/lib/utils";
import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ConfigurationSystemHealthVocabularyRail } from "@/components/ConfigurationSystemHealthVocabularyRail";
import { AdminConfigurationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { INTERNAL_CONFIGURATION_PATH } from "@/lib/internal-ops-route-paths";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";

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
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Configuration summary"
        description="In a connected tenant, administrators review catalog-aligned settings and deployment configuration here."
      />
    );
  }

  return (
    <OperatorPageContainer variant="workflow" className={OPERATOR_LAYOUT.sectionStack} data-testid="admin-configuration-page">
      <OperatorPageHeader
        navHref={INTERNAL_CONFIGURATION_PATH}
        title="Configuration summary"
        headingLevel="h1"
        subtitle="Effective values for non-sensitive keys; secrets and connection material are masked by the API. With more than one API replica, per-process graph caches are not shared — configure Redis before scale-out."
        actions={<PageContextualHelpButton />}
      >
        <ConfigurationSystemHealthVocabularyRail currentSurfaceId="configuration-summary" />

        <div className="flex flex-wrap items-end gap-4">
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
          <RefreshButton
            busy={m.loadState === "loading" || m.lintState === "loading"}
            data-testid="admin-configuration-refresh"
            onClick={() => void m.refreshAll()}
          />
        </div>
      </OperatorPageHeader>

      <AdminConfigurationEvidenceOrientationStrip />

      <Card data-testid="admin-configuration-env-health">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Environment health (config lint)</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Parity with <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>archlucid config lint</span> plus hosting advisor warnings (
            <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>includeAdvisory=true</span>). Blocking issues match fail-fast startup traps; no
            secrets appear in this view.
          </p>
        </CardHeader>
        <CardContent className={cn("space-y-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {m.lintState === "loading" ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-configuration-env-health-loading">
              Loading lint results…
            </p>
          ) : null}

          {m.lintState === "forbidden" ? (
            <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="admin-configuration-env-health-forbidden">
              Config lint requires tenant administrator access (same as the catalog summary above).
            </p>
          ) : null}

          {m.lintState === "error" ? (
            <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="admin-configuration-env-health-error">
              Could not load configuration lint. Check connectivity and try Refresh.
            </p>
          ) : null}

          {m.lintState === "empty" ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No structured lint payload was returned.</p>
          ) : null}

          {m.lintState === "ok" && m.lint !== null ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className={OPERATOR_TYPOGRAPHY.cardTitle}>Hosting environment</span>
                <span className={cn("rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.badge)}>
                  {normalizePath(m.lint.hostingEnvironmentName ?? "").length > 0 ? m.lint.hostingEnvironmentName : " — "}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5",
                    OPERATOR_TYPOGRAPHY.badge,
                    m.lint.ok === true
                      ? "bg-emerald-100 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50"
                      : "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-50",
                  )}
                  data-testid="admin-configuration-env-health-status"
                >
                  {m.lint.ok === true ? "No blocking findings" : "Blocking findings"}
                </span>
              </div>

              <div>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Blocking</p>
                <AdminConfigurationLintFindingList rows={m.lint.blockingFindings} />
              </div>

              <div>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Advisory</p>
                <AdminConfigurationLintFindingList rows={m.lint.advisoryFindings} />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {m.loadState === "forbidden" ? (
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="admin-configuration-forbidden">
          This page requires tenant administrator access (AdminAuthority). Sign in with an admin-ranked account or API key.
        </p>
      ) : null}

      {m.loadState === "error" ? (
        <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert" data-testid="admin-configuration-error">
          Could not load configuration summary. Check connectivity and try refresh.
        </p>
      ) : null}

      {m.loadState === "empty" ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-configuration-empty">
          No configuration keys were returned.
        </p>
      ) : null}

      {m.loadState === "ok" && m.filteredRows.length === 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-configuration-no-matches">
          No keys match the current search and category filters.
        </p>
      ) : null}

      {m.rowsBySection.map(({ section, items }) => {
        return (
          <Card key={section}>
            <CardHeader>
              <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>{section}</CardTitle>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{items.length} key(s) in this category</p>
            </CardHeader>
            <CardContent>
              <EnterpriseTable
                ariaLabel={`Configuration keys in ${section}`}
                className={OPERATOR_TYPOGRAPHY.body}
                data-testid={`admin-configuration-table-${sectionToTestIdSegment(section)}`}
              >
                <EnterpriseTableHead>
                  <EnterpriseTableHeadRow className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <EnterpriseTableHeaderCell className="py-2 pr-3">Key path</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell className="py-2 pr-3">Set</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell className="py-2 pr-3">Sources (catalog)</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell className="py-2 pr-3">Effective value</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell className="py-2 pr-3">Description</EnterpriseTableHeaderCell>
                  </EnterpriseTableHeadRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {items.map((row) => {
                    const setLabel = row.isSet === true ? "Yes" : "No";
                    const sources = formatSources(row.sources);
                    const ev = row.effectiveValue ?? " — ";
                    const desc = normalizePath(row.description).length > 0 ? row.description : " — ";
                    const pathKey = normalizePath(row.configPath).length > 0 ? row.configPath : " — ";

                    return (
                      <EnterpriseTableRow key={pathKey}>
                        <EnterpriseTableCell className={cn("py-2 pr-3 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                          {normalizePath(row.configPath).length > 0 ? row.configPath : " — "}
                        </EnterpriseTableCell>
                        <EnterpriseTableCell className="py-2 pr-3 text-al-text-primary">{setLabel}</EnterpriseTableCell>
                        <EnterpriseTableCell className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{sources}</EnterpriseTableCell>
                        <EnterpriseTableCell className={cn("py-2 pr-3 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>{ev}</EnterpriseTableCell>
                        <EnterpriseTableCell className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{desc}</EnterpriseTableCell>
                      </EnterpriseTableRow>
                    );
                  })}
                </EnterpriseTableBody>
              </EnterpriseTable>
            </CardContent>
          </Card>
        );
      })}
    </OperatorPageContainer>
  );
}
