"use client";

import Link from "next/link";

import { ContextualHelp } from "@/components/ContextualHelp";
import { StatusPill } from "@/components/StatusPill";
import { planningTableCls, planningThTdCls } from "@/components/planning/planning-table-styles";
import { Button } from "@/components/ui/button";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { formatProcessUptime } from "@/lib/format-process-uptime";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

import type { SystemHealthPageViewModel } from "./system-health-page-view-model";

type Props = {
  readonly model: SystemHealthPageViewModel;
};

export function SystemHealthPageView(props: Props) {
  const m = props.model;
  const overall = m.ready?.status ?? "Unknown";

  if (isBuyerPolishedOperatorShellEnv()) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <p className="m-0 font-medium text-neutral-800 dark:text-neutral-200">
          System health is not part of the sample review shell.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl" data-testid="system-health-page">
      <OperatorPageHeader
        title="System health"
        subtitle="API liveness, readiness dependencies, build identity, and process uptime for this deployment."
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <ContextualHelp helpKey="system-health" />
        <StatusPill
          status={overall}
          domain="health"
          uppercase={false}
          className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
          data-testid="system-health-overall-badge"
          ariaLabel={`Overall readiness: ${overall}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="system-health-refresh"
          disabled={m.loading}
          onClick={() => void m.refresh()}
        >
          {m.loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <section className="mb-6" aria-labelledby="system-health-probes-heading">
        <h2 id="system-health-probes-heading" className="text-sm font-semibold text-al-text-primary">
          Probes
        </h2>
        <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <dt className="font-medium text-neutral-800 dark:text-neutral-100">Liveness</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <StatusPill status={m.liveStatus} domain="health" uppercase={false} className="text-xs" />
              <span className="text-neutral-600 dark:text-neutral-400">
                GET /health/live — {m.liveOk ? "responding" : "not reachable"}
              </span>
            </dd>
          </div>
          <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <dt className="font-medium text-neutral-800 dark:text-neutral-100">Readiness</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <StatusPill status={overall} domain="health" uppercase={false} className="text-xs" />
              <span className="text-neutral-600 dark:text-neutral-400">GET /health/ready</span>
            </dd>
          </div>
        </dl>
        {m.readyError !== null ? (
          <p className="mt-2 text-sm text-rose-800 dark:text-rose-200" role="alert">
            {m.readyError}
          </p>
        ) : null}
      </section>

      <section className="mb-6" aria-labelledby="system-health-build-heading">
        <h2 id="system-health-build-heading" className="text-sm font-semibold text-al-text-primary">
          Build identity
        </h2>
        <div
          className="mt-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/50"
          data-testid="system-health-build-identity"
        >
          <p className="m-0">
            <span className="font-medium">Version: </span>
            <span className="font-mono text-xs">{m.version?.informationalVersion ?? "—"}</span>
          </p>
          <p className="m-0 mt-1">
            <span className="font-medium">Commit: </span>
            <span className="font-mono text-xs">{m.version?.commitSha ?? "—"}</span>
          </p>
          <p className="m-0 mt-1" data-testid="system-health-uptime">
            <span className="font-medium">Process uptime: </span>
            <span>{formatProcessUptime(m.version?.processUptimeSeconds)}</span>
          </p>
        </div>
      </section>

      <section className="mb-6" aria-labelledby="system-health-dependencies-heading">
        <h2 id="system-health-dependencies-heading" className="text-sm font-semibold text-al-text-primary">
          Critical dependencies
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Status from readiness checks registered for SQL, Azure OpenAI, and Redis.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className={planningTableCls} data-testid="system-health-dependencies-table">
            <thead>
              <tr>
                <th className={planningThTdCls} scope="col">
                  Dependency
                </th>
                <th className={planningThTdCls} scope="col">
                  Check
                </th>
                <th className={planningThTdCls} scope="col">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {m.criticalDependencies.map((row) => (
                <tr key={row.entryName}>
                  <td className={planningThTdCls}>{row.label}</td>
                  <td className={planningThTdCls}>
                    <code className="text-xs">{row.entryName}</code>
                    <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">{row.detail}</p>
                  </td>
                  <td className={planningThTdCls}>
                    <StatusPill status={row.status} domain="health" uppercase={false} className="text-xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Tenant administrators can open{" "}
        <Link href="/admin/health" className="font-medium text-teal-800 underline dark:text-teal-300">
          Admin → System health
        </Link>{" "}
        for circuit breakers, config lint, and onboarding funnel metrics.
      </p>
    </div>
  );
}
