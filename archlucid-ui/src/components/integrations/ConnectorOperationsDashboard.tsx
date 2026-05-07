"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorLoadingNotice } from "@/components/OperatorShellMessage";
import { Badge } from "@/components/ui/badge";
import { fetchTenantIntegrationsOperations } from "@/lib/api";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { cn } from "@/lib/utils";
import type { ConnectorSurfaceStatusDto, TenantIntegrationsOperationsDto } from "@/types/operate-rhythm";

function smokeBadgeClass(readiness: string): string {
  if (readiness === "LocallyValid" || readiness === "RouteConfigured")
    return "border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-200";

  if (readiness === "NotConfigured")
    return "border-neutral-300 text-neutral-600 dark:border-neutral-600 dark:text-neutral-400";

  return "border-amber-300 text-amber-900 dark:border-amber-800 dark:text-amber-200";
}

export function ConnectorOperationsDashboard(): ReactElement {
  const [data, setData] = useState<TenantIntegrationsOperationsDto | null>(null);
  const [problem, setProblem] = useState<{ problem?: ApiProblemDetails; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      setLoading(true);
      setProblem(null);

      try {
        const row = await fetchTenantIntegrationsOperations();

        if (!cancelled) {
          setData(row);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setProblem({ message: e instanceof Error ? e.message : "Could not load connector operations summary." });
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return (
      <OperatorLoadingNotice>
        <strong>Loading integration posture.</strong>
      </OperatorLoadingNotice>
    );
  }

  if (problem !== null) {
    return <OperatorApiProblem problem={problem.problem} fallbackMessage={problem.message} variant="warning" />;
  }

  if (!data) {
    return <></>;
  }

  const bus = data.integrationEventBus;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
          Connectors &amp; routes
        </h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Deterministic readiness from configuration and tenant rows—no live vendor calls. Resolve secrets via Key Vault in production.
        </p>
        <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-2">
          {data.connectors.map((c: ConnectorSurfaceStatusDto) => (
            <li
              key={c.connectorKey}
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <strong className="text-sm text-neutral-900 dark:text-neutral-100">{c.displayName}</strong>
                <Badge variant="outline" className={cn("text-xs", smokeBadgeClass(c.smokeReadiness))}>
                  {c.smokeReadiness}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{c.summary}</p>
              {c.configurationHref ? (
                <Link
                  className="mt-2 inline-block text-xs font-medium text-teal-800 underline dark:text-teal-300"
                  href={c.configurationHref}
                >
                  Open configuration
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className="m-0 text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
          Integration event bus
        </h2>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          Publisher: {bus.publisherConfigured ? "configured" : "not configured"}
          {" · "}
          Transactional outbox: {bus.transactionalOutboxEnabled ? "enabled" : "off"}
          {" · "}
          Consumer: {bus.consumerConfigured ? "configured" : "off"}
        </p>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Queue/topic name: {bus.queueOrTopicName ?? "—"} · Namespace: {bus.fullyQualifiedNamespace ?? "—"} · Legacy connection string:{" "}
          {bus.usesLegacyConnectionString ? "present" : "absent"}
        </p>
        <Badge variant="outline" className={cn("mt-2 text-xs", smokeBadgeClass(bus.smokeReadiness))}>
          {bus.smokeReadiness}
        </Badge>
      </section>
    </div>
  );
}
