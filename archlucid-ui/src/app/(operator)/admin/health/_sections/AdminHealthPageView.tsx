"use client";
import { cn } from "@/lib/utils";

import { DemoWorkspaceCapabilityUnavailablePanel } from "@/components/DemoWorkspaceCapabilityUnavailablePanel";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { isDataArchivalHealthDegraded } from "@/lib/health-dashboard-types";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { isInternalTestBuildVersion } from "./admin-health-helpers";
import type { AdminHealthPageViewModel } from "./admin-health-view-model";

type Props = {
  readonly model: AdminHealthPageViewModel;
};

/**
 * In-app diagnostics: readiness (`/health/ready`), authenticated circuit data (`/health/diagnostics`),
 * build identity (`/version`),
 * and onboarding funnel counters (`/v1/diagnostics/operator-task-success-rates`).
 */
export function AdminHealthPageView(props: Props) {
  const m = props.model;

  if (m.isDemo) {
    return (
      <DemoWorkspaceCapabilityUnavailablePanel
        capability="Workspace health diagnostics"
        description="In a connected tenant, operators monitor platform health, readiness, and onboarding diagnostics here."
      />
    );
  }

  const internalTestBuildDisclosure = isInternalTestBuildVersion(m.version);
  const overall = m.ready?.status ?? "Unknown";
  const archivalDegraded =
    m.ready !== null && isDataArchivalHealthDegraded(m.ready.entries);

  return (
    <div className="w-full max-w-3xl space-y-6" data-testid="admin-health-page">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>System health</h1>
          <StatusPill
            status={overall}
            domain="health"
            uppercase={false}
            className="rounded-lg border px-4 py-2 text-lg font-semibold"
            data-testid="admin-health-overall-badge"
            ariaLabel={`Overall readiness: ${overall}`}
          />
        </div>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          API readiness, circuit breakers, and in-process onboarding counters for this deployment. For full metrics,
          connect Prometheus or Application Insights from the Observability help topic.
        </p>
        <div className="mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="admin-health-refresh"
            disabled={m.loading}
            onClick={() => void m.refresh()}
          >
            {m.loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Readiness checks</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Readiness checks — dependency probes load balancers use before routing traffic.
          </p>
        </CardHeader>
        <CardContent>
          {m.readyError !== null ? (
            <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
              {m.readyError}
            </p>
          ) : null}
          {archivalDegraded ? (
            <div
              className={cn(
                "mb-4 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
                OPERATOR_TYPOGRAPHY.body,
              )}
              role="status"
              data-testid="admin-health-data-archival-degraded"
            >
              <strong className="font-semibold">Data archival</strong> is <strong>Degraded</strong> — the last retention
              archival iteration failed while archival was enabled. Review worker logs and{" "}
              <code className={cn("rounded bg-amber-100/80 px-1 dark:bg-amber-900/60", OPERATOR_TYPOGRAPHY.micro)}>docs/runbooks/DATA_ARCHIVAL_HEALTH.md</code>{" "}
              (readiness check <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>data_archival</span>).
            </div>
          ) : null}
          {m.version !== null ? (
            <div className={cn("mb-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-build-identity">
              {internalTestBuildDisclosure ? (
                <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Build labels in this environment use internal test identifiers — detailed version strings are hidden.
                </p>
              ) : (
                <>
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                    <span className="font-medium text-al-text-primary">Version: </span>
                    <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{m.version.informationalVersion ?? "—"}</span>
                  </p>
                  <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.body)}>
                    <span className="font-medium text-al-text-primary">Commit: </span>
                    <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{m.version.commitSha ?? "—"}</span>
                  </p>
                </>
              )}
            </div>
          ) : null}
          {m.ready && m.ready.entries.length > 0 ? (
            <div className="space-y-2">
              <div className="overflow-x-auto">
                <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-ready-table">
                  <thead>
                    <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                      <th className="py-2 pr-3">Check</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.ready.entries.map((e) => {
                      const durationMs = typeof e.durationMs === "number" && Number.isFinite(e.durationMs) ? e.durationMs : null;

                      return (
                        <tr key={e.name} className="border-b border-neutral-100 dark:border-neutral-800">
                          <td className={cn("py-2 pr-3 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>{e.name}</td>
                        <td className="py-2 pr-3">
                          <StatusPill
                            status={e.status}
                            domain="health"
                            uppercase={false}
                            className={cn("rounded-md px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge)}
                          />
                        </td>
                          <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                            {durationMs !== null ? `${Math.round(durationMs)} ms` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="admin-health-ready-duration-footnote">
                Readiness responses normally omit per-check duration unless the API includes them.
              </p>
            </div>
          ) : (
            !m.readyError && <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No readiness entries.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Configuration probes</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Live connectivity checks for SQL, OIDC authority metadata, and optional Key Vault — from{" "}
            <code className={OPERATOR_TYPOGRAPHY.micro}>GET /v1/diagnostics/configuration-health</code>.
          </p>
        </CardHeader>
        <CardContent>
          {m.configurationHealthNote !== null ? (
            <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-configuration-health-note">
              {m.configurationHealthNote}
            </p>
          ) : null}
          {m.configurationHealth !== null && (m.configurationHealth.checks?.length ?? 0) > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-configuration-health-table">
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-3">Probe</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {(m.configurationHealth.checks ?? []).map((row) => (
                    <tr key={row.name} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className={cn("py-2 pr-3 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>{row.name}</td>
                      <td className="py-2 pr-3">
                        <StatusPill
                          status={row.status}
                          domain="health"
                          uppercase={false}
                          className={cn("rounded-md px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge)}
                        />
                      </td>
                      <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.detail ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            !m.configurationHealthNote && (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No configuration probe results returned.</p>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Environment health (config lint)</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Parity with <code className={OPERATOR_TYPOGRAPHY.micro}>archlucid config lint</code> — blocking findings and hosting advisor rows
            (no secrets).
          </p>
        </CardHeader>
        <CardContent>
          {m.configLintNote !== null ? (
            <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-config-lint-note">
              {m.configLintNote}
            </p>
          ) : null}
          {m.configLint !== null ? (
            <div className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-config-lint-body">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Hosting profile:{" "}
                <span className="font-medium text-al-text-primary">
                  {m.configLint.hostingEnvironmentName ?? "—"}
                </span>
              </p>
              <div>
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Blocking</p>
                {m.configLint.blockingFindings && m.configLint.blockingFindings.length > 0 ? (
                  <ul className={cn("mt-1 list-disc space-y-1 ps-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {m.configLint.blockingFindings.map((f, i) => (
                      <li key={`${f.ruleName ?? "rule"}-${String(i)}`}>
                        <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{f.ruleName}</span> — {f.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>None — config lint OK for this profile.</p>
                )}
              </div>
              <div>
                <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Advisory</p>
                {m.configLint.advisoryFindings && m.configLint.advisoryFindings.length > 0 ? (
                  <ul className={cn("mt-1 list-disc space-y-1 ps-5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {m.configLint.advisoryFindings.map((f, i) => (
                      <li key={`${f.ruleName ?? "adv"}-${String(i)}`}>
                        <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{f.ruleName}</span> — {f.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>None returned.</p>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Circuit breakers</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Model and embedding circuit gates when authenticated health detail is available.
          </p>
        </CardHeader>
        <CardContent>
          {m.circuitNote !== null ? (
            <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-circuit-note">
              {m.circuitNote}
            </p>
          ) : null}
          {m.circuitGates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-circuit-table">
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-3">Gate</th>
                    <th className="py-2 pr-3">State</th>
                    <th className="py-2 pr-3">Duration of break (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {m.circuitGates.map((g) => {
                    return (
                      <tr key={g.name} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className={cn("py-2 pr-3 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>{g.name}</td>
                        <td className="py-2 pr-3">
                          <StatusPill
                            status={g.state}
                            domain="health"
                            uppercase={false}
                            className={cn("rounded-md px-2 py-0.5", OPERATOR_TYPOGRAPHY.badge)}
                          />
                        </td>
                        <td className={cn("py-2 pr-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                          {g.breakDurationSeconds != null && Number.isFinite(g.breakDurationSeconds) ? String(g.breakDurationSeconds) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            !m.circuitNote && <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No circuit gate data (OpenAI may be unwired in this process).</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Operator task success rates</CardTitle>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>In-process meter snapshot (resets on API host restart).</p>
        </CardHeader>
        <CardContent>
          {m.ratesNote !== null ? (
            <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)} data-testid="admin-health-rates-note">
              {m.ratesNote}
            </p>
          ) : null}
          {m.rates ? (
            <div className="space-y-3" data-testid="admin-health-rates-table">
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-3">Metric</th>
                    <th className="py-2 pr-3">Value</th>
                    <th className="py-2 pr-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2 pr-3">first_run_committed (count)</td>
                    <td className="py-2 pr-3 font-semibold">{m.rates.firstRunCommittedTotal}</td>
                    <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Process lifetime</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2 pr-3">first_session_completed (count)</td>
                    <td className="py-2 pr-3 font-semibold">{m.rates.firstSessionCompletedTotal}</td>
                    <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Process lifetime</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2 pr-3">first_run / first_session ratio</td>
                    <td className="py-2 pr-3 font-semibold">{m.rates.firstRunCommittedPerSessionRatio.toFixed(4)}</td>
                    <td className={cn("py-2 pr-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>—</td>
                  </tr>
                </tbody>
              </table>
              {m.rates.windowNote !== undefined &&
              m.rates.windowNote !== null &&
              m.rates.windowNote.trim().length > 0 &&
              !/e2e|screenshot|fixture/i.test(m.rates.windowNote) ? (
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{m.rates.windowNote}</p>
              ) : null}
            </div>
          ) : (
            !m.ratesNote && <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>(Endpoint not yet available)</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
