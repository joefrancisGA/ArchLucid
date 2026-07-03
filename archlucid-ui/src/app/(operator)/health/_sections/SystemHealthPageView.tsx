"use client";

import Link from "next/link";

import { StatusPill } from "@/components/StatusPill";
import { DeploymentBuildFingerprintStrip } from "@/components/shell/DeploymentBuildFingerprintStrip";
import { planningTableCls, planningThTdCls } from "@/components/planning/planning-table-styles";
import { Button } from "@/components/ui/button";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { formatProcessUptime } from "@/lib/format-process-uptime";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import type { SystemHealthPageViewModel } from "./system-health-page-view-model";

type Props = {
  readonly model: SystemHealthPageViewModel;
};

export function SystemHealthPageView(props: Props) {
  const m = props.model;
  const overall = m.ready?.status ?? "Unknown";

  if (isBuyerPolishedOperatorShellEnv()) {
    return (
      <div
        className={cn(
          "rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-al-text-secondary dark:border-neutral-800 dark:bg-neutral-900",
          OPERATOR_TYPOGRAPHY.body,
        )}
      >
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          System health is not part of the sample review shell.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl" data-testid="system-health-page">
      <OperatorPageHeader
        title="System health"
        subtitle="API liveness, readiness dependencies, build identity, and process uptime. For full metrics, connect Prometheus or Application Insights from the Observability help topic."
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <StatusPill
          status={overall}
          domain="health"
          uppercase={false}
          className={cn("rounded-lg border px-3 py-1.5", OPERATOR_TYPOGRAPHY.body, "font-semibold")}
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
        <h2 id="system-health-probes-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Probes
        </h2>
        <dl className={cn("mt-2 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
          <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Liveness</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <StatusPill status={m.liveStatus} domain="health" uppercase={false} className={OPERATOR_TYPOGRAPHY.badge} />
              <span className="text-al-text-secondary">
                GET /health/live — {m.liveOk ? "responding" : "not reachable"}
              </span>
            </dd>
          </div>
          <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
            <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Readiness</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <StatusPill status={overall} domain="health" uppercase={false} className={OPERATOR_TYPOGRAPHY.badge} />
              <span className="text-al-text-secondary">GET /health/ready</span>
            </dd>
          </div>
        </dl>
        {m.readyError !== null ? (
          <p className={cn("mt-2 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {m.readyError}
          </p>
        ) : null}
      </section>

      <section className="mb-6" aria-labelledby="system-health-build-heading">
        <h2 id="system-health-build-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Build identity
        </h2>
        <div
          className={cn(
            "mt-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="system-health-build-identity"
        >
          <p className="m-0">
            <span className={OPERATOR_TYPOGRAPHY.cardTitle}>Version: </span>
            <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{m.version?.informationalVersion ?? "—"}</span>
          </p>
          <p className="m-0 mt-1">
            <span className={OPERATOR_TYPOGRAPHY.cardTitle}>Commit: </span>
            <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{m.version?.commitSha ?? "—"}</span>
          </p>
          <p className="m-0 mt-1">
            <span className={OPERATOR_TYPOGRAPHY.cardTitle}>Build timestamp: </span>
            <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>{m.version?.buildTimestamp ?? "—"}</span>
          </p>
          <p className="m-0 mt-1">
            <span className={OPERATOR_TYPOGRAPHY.cardTitle}>Environment: </span>
            <span>{m.version?.environment ?? "—"}</span>
          </p>
          <p className="m-0 mt-1" data-testid="system-health-uptime">
            <span className={OPERATOR_TYPOGRAPHY.cardTitle}>Process uptime: </span>
            <span>{formatProcessUptime(m.version?.processUptimeSeconds)}</span>
          </p>
        </div>
        <div className="mt-3" data-testid="system-health-ui-build-identity">
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>UI build</p>
          <DeploymentBuildFingerprintStrip className="mt-1" />
        </div>
      </section>

      <section className="mb-6" aria-labelledby="system-health-dependencies-heading">
        <h2 id="system-health-dependencies-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Critical dependencies
        </h2>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
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
                    <code className={OPERATOR_TYPOGRAPHY.micro}>{row.entryName}</code>
                    <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{row.detail}</p>
                  </td>
                  <td className={planningThTdCls}>
                    <StatusPill status={row.status} domain="health" uppercase={false} className={OPERATOR_TYPOGRAPHY.badge} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Tenant administrators can open{" "}
        <Link href="/admin/health" className={OPERATOR_LINK.nav}>
          Admin → System health
        </Link>{" "}
        for circuit breakers, config lint, and onboarding funnel metrics.
      </p>
    </div>
  );
}
