import type { ReactNode } from "react";

export type SponsorRoiSavingsTrendPoint = {
  readonly snapshotUtc: string;
  readonly totalEstimatedUsdSavings: number;
};

export type SponsorRoiSavingsTrendSvgChartProps = {
  readonly points: SponsorRoiSavingsTrendPoint[];
  readonly chartHeightPx?: number;
};

const CHART_WIDTH = 400;
const CHART_HEIGHT_DEFAULT = 160;
const PADDING_LEFT = 44;
const PADDING_RIGHT = 8;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 28;

function formatMonthLabel(isoUtc: string): string {
  const date = new Date(isoUtc);

  if (Number.isNaN(date.getTime())) {
    return " — ";
  }

  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
}

function formatUsdTooltip(value: number, monthLabel: string): string {
  const rounded = Math.round(value).toLocaleString();

  return `$${rounded} — ${monthLabel}`;
}

function buildYAxisTicks(maxValue: number, tickCount: number): number[] {
  const safeMax = Math.max(maxValue, 1);
  const step = safeMax / Math.max(tickCount - 1, 1);
  const ticks: number[] = [];

  for (let i = 0; i < tickCount; i += 1) {
    ticks.push(Math.round(step * i));
  }

  return ticks;
}

function formatYAxisLabel(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}k`;
  }

  return `$${value}`;
}

/** Inline SVG bar chart for sponsor ROI savings trend (TB-245). */
export function SponsorRoiSavingsTrendSvgChart(props: SponsorRoiSavingsTrendSvgChartProps): ReactNode {
  const { points, chartHeightPx = CHART_HEIGHT_DEFAULT } = props;

  if (points.length === 0) {
    return null;
  }

  const maxSavings = Math.max(...points.map((point) => point.totalEstimatedUsdSavings), 1);
  const yTicks = buildYAxisTicks(maxSavings, 4);
  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = chartHeightPx - PADDING_TOP - PADDING_BOTTOM;
  const barSlotWidth = plotWidth / points.length;
  const barWidth = Math.max(12, Math.min(32, barSlotWidth * 0.6));

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${chartHeightPx}`}
      className="min-h-[160px] w-full"
      role="img"
      aria-label="Estimated USD savings by month"
      data-testid="exec-roi-trend-svg-chart"
    >
      {yTicks.map((tick) => {
        const yRatio = tick / maxSavings;
        const y = PADDING_TOP + plotHeight - yRatio * plotHeight;

        return (
          <g key={`y-tick-${tick}`}>
            <line
              x1={PADDING_LEFT}
              x2={CHART_WIDTH - PADDING_RIGHT}
              y1={y}
              y2={y}
              className="stroke-neutral-200 dark:stroke-neutral-700"
              strokeWidth={1}
            />
            <text
              x={PADDING_LEFT - 6}
              y={y + 4}
              textAnchor="end"
              className="fill-neutral-500 text-[9px] dark:fill-neutral-400"
            >
              {formatYAxisLabel(tick)}
            </text>
          </g>
        );
      })}
      {points.map((point, index) => {
        const monthLabel = formatMonthLabel(point.snapshotUtc);
        const barHeight = Math.max(4, (point.totalEstimatedUsdSavings / maxSavings) * plotHeight);
        const centerX = PADDING_LEFT + barSlotWidth * index + barSlotWidth / 2;
        const x = centerX - barWidth / 2;
        const y = PADDING_TOP + plotHeight - barHeight;

        return (
          <g key={point.snapshotUtc}>
            <title>{formatUsdTooltip(point.totalEstimatedUsdSavings, monthLabel)}</title>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={2}
              className="fill-emerald-500/85"
              data-testid="exec-roi-trend-svg-bar"
            />
            <text
              x={centerX}
              y={chartHeightPx - 6}
              textAnchor="middle"
              className="fill-neutral-500 text-[9px] dark:fill-neutral-400"
            >
              {monthLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
