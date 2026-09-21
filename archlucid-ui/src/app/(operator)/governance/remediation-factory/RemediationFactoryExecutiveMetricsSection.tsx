"use client";

import Link from "next/link";

import { buildRemediationFactoryExecutiveMetricTiles } from "@/lib/remediation-factory/remediation-factory-metrics-presentation";
import type { RemediationFactoryMetrics } from "@/lib/remediation-factory-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

function MetricTileBody(props: {
  readonly label: string;
  readonly scopeLine: string;
  readonly windowLine?: string;
  readonly ruleLine?: string;
  readonly value: string | null;
}) {
  const notComputed = props.value === null;

  return (
    <>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{props.label}</p>
      <p className={cn(notComputed ? OPERATOR_TYPOGRAPHY.helper : OPERATOR_TYPOGRAPHY.kpiValue)}>
        {notComputed ? "Not computed" : props.value}
      </p>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{props.scopeLine}</p>
      {props.windowLine ? <p className={OPERATOR_TYPOGRAPHY.helper}>{props.windowLine}</p> : null}
      {props.ruleLine ? <p className={OPERATOR_TYPOGRAPHY.helper}>{props.ruleLine}</p> : null}
    </>
  );
}

export function RemediationFactoryExecutiveMetricsSection(props: {
  readonly metrics: RemediationFactoryMetrics | undefined;
  readonly metricsLoaded: boolean;
}) {
  const tiles = buildRemediationFactoryExecutiveMetricTiles(props.metrics, props.metricsLoaded);

  return (
    <section aria-label="Executive remediation metrics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => {
        const shellClass = "rounded border border-border bg-card p-4 block";

        if (tile.href !== undefined && tile.value !== null) {
          return (
            <Link
              key={tile.id}
              href={tile.href}
              className={cn(shellClass, "hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
              data-testid={`remediation-metric-${tile.id}`}
            >
              <MetricTileBody
                label={tile.label}
                scopeLine={tile.scopeLine}
                windowLine={tile.windowLine}
                ruleLine={tile.ruleLine}
                value={tile.value}
              />
            </Link>
          );
        }

        return (
          <div key={tile.id} className={shellClass} data-testid={`remediation-metric-${tile.id}`}>
            <MetricTileBody
              label={tile.label}
              scopeLine={tile.scopeLine}
              windowLine={tile.windowLine}
              ruleLine={tile.ruleLine}
              value={tile.value}
            />
          </div>
        );
      })}
    </section>
  );
}
