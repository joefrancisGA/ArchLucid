"use client";

import { ContextualHelp } from "@/components/ContextualHelp";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Diagnostics not available in demo mode.</p>
        <p className="m-0 mt-1">Platform health is visible to operators with a live API connection.</p>
      </div>
    );
  }

  const internalTestBuildDisclosure = isInternalTestBuildVersion(m.version);
  const overall = m.ready?.status ?? "Unknown";

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="admin-health-page">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">System health</h1>
          <ContextualHelp helpKey="system-health" />
          <StatusPill
            status={overall}
            domain="health"
            uppercase={false}
            className="rounded-lg border px-4 py-2 text-lg font-semibold"
            data-testid="admin-health-overall-badge"
            ariaLabel={`Overall readiness: ${overall}`}
          />
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">API readiness, circuit breakers, and in-process onboarding counters for this deployment.</p>
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
          <CardTitle className="text-base">Readiness checks</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            Readiness checks — dependency probes load balancers use before routing traffic.
          </p>
        </CardHeader>
        <CardContent>
          {m.readyError !== null ? (
            <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert">
              {m.readyError}
            </p>
          ) : null}
          {m.version !== null ? (
            <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/50" data-testid="admin-health-build-identity">
              {internalTestBuildDisclosure ? (
                <p className="m-0 text-neutral-700 dark:text-neutral-200">
                  Build labels in this environment use internal test identifiers — detailed version strings are hidden.
                </p>
              ) : (
                <>
                  <p className="m-0">
                    <span className="font-medium text-neutral-800 dark:text-neutral-100">Version: </span>
                    <span className="font-mono text-xs">{m.version.informationalVersion ?? "—"}</span>
                  </p>
                  <p className="m-0 mt-1">
                    <span className="font-medium text-neutral-800 dark:text-neutral-100">Commit: </span>
                    <span className="font-mono text-xs">{m.version.commitSha ?? "—"}</span>
                  </p>
                </>
              )}
            </div>
          ) : null}
          {m.ready && m.ready.entries.length > 0 ? (
            <div className="space-y-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" data-testid="admin-health-ready-table">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
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
                          <td className="py-2 pr-3 font-mono text-xs text-neutral-800 dark:text-neutral-200">{e.name}</td>
                        <td className="py-2 pr-3">
                          <StatusPill
                            status={e.status}
                            domain="health"
                            uppercase={false}
                            className="rounded-md px-2 py-0.5 text-xs font-medium"
                          />
                        </td>
                          <td className="py-2 pr-3 text-neutral-500 dark:text-neutral-400">
                            {durationMs !== null ? `${Math.round(durationMs)} ms` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400" data-testid="admin-health-ready-duration-footnote">
                Readiness responses normally omit per-check duration unless the API includes them.
              </p>
            </div>
          ) : (
            !m.readyError && <p className="m-0 text-sm text-neutral-500">No readiness entries.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Environment health (config lint)</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            Parity with <code className="text-xs">archlucid config lint</code> — blocking findings and hosting advisor rows
            (no secrets).
          </p>
        </CardHeader>
        <CardContent>
          {m.configLintNote !== null ? (
            <p className="m-0 text-sm text-amber-900 dark:text-amber-100" data-testid="admin-health-config-lint-note">
              {m.configLintNote}
            </p>
          ) : null}
          {m.configLint !== null ? (
            <div className="space-y-3 text-sm" data-testid="admin-health-config-lint-body">
              <p className="m-0 text-neutral-600 dark:text-neutral-400">
                Hosting profile:{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {m.configLint.hostingEnvironmentName ?? "—"}
                </span>
              </p>
              <div>
                <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Blocking</p>
                {m.configLint.blockingFindings && m.configLint.blockingFindings.length > 0 ? (
                  <ul className="mt-1 list-disc space-y-1 ps-5 text-neutral-700 dark:text-neutral-300">
                    {m.configLint.blockingFindings.map((f, i) => (
                      <li key={`${f.ruleName ?? "rule"}-${String(i)}`}>
                        <span className="font-mono text-xs">{f.ruleName}</span> — {f.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">None — config lint OK for this profile.</p>
                )}
              </div>
              <div>
                <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">Advisory</p>
                {m.configLint.advisoryFindings && m.configLint.advisoryFindings.length > 0 ? (
                  <ul className="mt-1 list-disc space-y-1 ps-5 text-neutral-700 dark:text-neutral-300">
                    {m.configLint.advisoryFindings.map((f, i) => (
                      <li key={`${f.ruleName ?? "adv"}-${String(i)}`}>
                        <span className="font-mono text-xs">{f.ruleName}</span> — {f.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">None returned.</p>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Circuit breakers</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            Model and embedding circuit gates when authenticated health detail is available.
          </p>
        </CardHeader>
        <CardContent>
          {m.circuitNote !== null ? (
            <p className="m-0 text-sm text-amber-900 dark:text-amber-100" data-testid="admin-health-circuit-note">
              {m.circuitNote}
            </p>
          ) : null}
          {m.circuitGates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="admin-health-circuit-table">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
                    <th className="py-2 pr-3">Gate</th>
                    <th className="py-2 pr-3">State</th>
                    <th className="py-2 pr-3">Duration of break (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {m.circuitGates.map((g) => {
                    return (
                      <tr key={g.name} className="border-b border-neutral-100 dark:border-neutral-800">
                        <td className="py-2 pr-3 font-mono text-xs text-neutral-800 dark:text-neutral-200">{g.name}</td>
                        <td className="py-2 pr-3">
                          <StatusPill
                            status={g.state}
                            domain="health"
                            uppercase={false}
                            className="rounded-md px-2 py-0.5 text-xs font-medium"
                          />
                        </td>
                        <td className="py-2 pr-3 text-neutral-700 dark:text-neutral-300">
                          {g.breakDurationSeconds != null && Number.isFinite(g.breakDurationSeconds) ? String(g.breakDurationSeconds) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            !m.circuitNote && <p className="m-0 text-sm text-neutral-500">No circuit gate data (OpenAI may be unwired in this process).</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operator task success rates</CardTitle>
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">In-process meter snapshot (resets on API host restart).</p>
        </CardHeader>
        <CardContent>
          {m.ratesNote !== null ? (
            <p className="m-0 text-sm text-amber-900 dark:text-amber-100" data-testid="admin-health-rates-note">
              {m.ratesNote}
            </p>
          ) : null}
          {m.rates ? (
            <div className="space-y-3" data-testid="admin-health-rates-table">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
                    <th className="py-2 pr-3">Metric</th>
                    <th className="py-2 pr-3">Value</th>
                    <th className="py-2 pr-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2 pr-3">first_run_committed (count)</td>
                    <td className="py-2 pr-3 font-semibold">{m.rates.firstRunCommittedTotal}</td>
                    <td className="py-2 pr-3 text-neutral-500">Process lifetime</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2 pr-3">first_session_completed (count)</td>
                    <td className="py-2 pr-3 font-semibold">{m.rates.firstSessionCompletedTotal}</td>
                    <td className="py-2 pr-3 text-neutral-500">Process lifetime</td>
                  </tr>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-2 pr-3">first_run / first_session ratio</td>
                    <td className="py-2 pr-3 font-semibold">{m.rates.firstRunCommittedPerSessionRatio.toFixed(4)}</td>
                    <td className="py-2 pr-3 text-neutral-500">—</td>
                  </tr>
                </tbody>
              </table>
              {m.rates.windowNote !== undefined &&
              m.rates.windowNote !== null &&
              m.rates.windowNote.trim().length > 0 &&
              !/e2e|screenshot|fixture/i.test(m.rates.windowNote) ? (
                <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">{m.rates.windowNote}</p>
              ) : null}
            </div>
          ) : (
            !m.ratesNote && <p className="m-0 text-sm text-neutral-500">(Endpoint not yet available)</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
