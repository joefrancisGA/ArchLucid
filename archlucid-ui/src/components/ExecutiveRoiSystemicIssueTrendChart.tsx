"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ExecutiveRoiSystemicIssueTrendSeries } from "@/lib/executive-summary-markdown";

export type ExecutiveRoiSystemicIssueTrendChartProps = {
  series: ExecutiveRoiSystemicIssueTrendSeries[];
  savingsPricingBasis?: string | null;
};

const SERIES_COLORS = ["#0284c7", "#7c3aed", "#f59e0b", "#0f766e", "#e11d48"] as const;

function safeCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function formatMonthKey(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());

  if (match == null) {
    return monthKey;
  }

  return `${match[2]}/${match[1].slice(2)}`;
}

function formatPricingBasisLabel(savingsPricingBasis: string | null | undefined): string {
  const basis = (savingsPricingBasis ?? "Retail").trim();

  if (basis.length === 0) {
    return "Retail list pricing";
  }

  if (basis.toLowerCase() === "ea-adjusted") {
    return "EA-adjusted savings basis";
  }

  return `${basis} savings basis`;
}

type ChartRow = Record<string, string | number> & {
  monthKey: string;
  monthLabel: string;
};

/** Recharts stacked bar chart for top systemic issue counts over the trailing six months. */
export function ExecutiveRoiSystemicIssueTrendChart(props: ExecutiveRoiSystemicIssueTrendChartProps) {
  const { series, savingsPricingBasis } = props;

  if (series.length === 0) {
    return (
      <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
        No historical systemic issue trends yet — commit architecture reviews to populate this chart.
      </p>
    );
  }

  const monthKeys = series[0]?.points.map((point) => point.monthKey) ?? [];
  const normalized = series.map((entry, index) => ({
    dataKey: `${entry.category} · ${entry.severity}`,
    color: SERIES_COLORS[index % SERIES_COLORS.length],
    countsByMonth: new Map(entry.points.map((point) => [point.monthKey, safeCount(point.count)])),
  }));

  const chartRows: ChartRow[] = monthKeys.map((monthKey) => {
    const row: ChartRow = {
      monthKey,
      monthLabel: formatMonthKey(monthKey),
    };

    for (const entry of normalized) {
      row[entry.dataKey] = entry.countsByMonth.get(monthKey) ?? 0;
    }

    return row;
  });

  const pricingBasisLabel = formatPricingBasisLabel(savingsPricingBasis);

  return (
    <div className="space-y-2" data-testid="exec-roi-systemic-issue-trend-chart">
      <div className="h-64 w-full min-w-0" role="img" aria-label="Systemic issue counts by month">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
            <Tooltip
              formatter={(value: number, name: string) => [`${value} findings`, name]}
              labelFormatter={(label: string) => `${label} · ${pricingBasisLabel}`}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            {normalized.map((entry) => (
              <Bar key={entry.dataKey} dataKey={entry.dataKey} stackId="issues" fill={entry.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
