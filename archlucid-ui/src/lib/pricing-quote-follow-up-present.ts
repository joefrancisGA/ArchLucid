import type { PricingQuoteAgingDashboard, PricingQuoteAgingRow } from "@/lib/pricing-quote-aging";

export const PRICING_QUOTE_SLA_WARN_HOURS = 18;
export const PRICING_QUOTE_SLA_BREACH_HOURS = 24;

export type PricingQuoteSlaBadge =
  | "New"
  | "On track"
  | "Follow up soon"
  | "Past SLA"
  | "Contacted";

export type PricingQuoteFollowUpHeadlineTone = "healthy" | "warn" | "breach";

export type PricingQuoteFollowUpSummaryTile = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly tone: "healthy" | "neutral" | "attention" | "breach";
};

export type PricingQuoteFollowUpHeadline = {
  readonly message: string;
  readonly tone: PricingQuoteFollowUpHeadlineTone;
};

const NEW_REQUEST_MAX_AGE_HOURS = 4;

export function extractEmailDomain(workEmail: string): string {
  const atIndex = workEmail.lastIndexOf("@");

  if (atIndex < 0 || atIndex === workEmail.length - 1) {
    return "—";
  }

  return workEmail.slice(atIndex + 1);
}

export function formatPricingQuoteAgeHours(ageHours: number): string {
  if (!Number.isFinite(ageHours) || ageHours < 0) {
    return "—";
  }

  if (ageHours < 1) {
    return `${Math.round(ageHours * 60)}m`;
  }

  return `${ageHours.toFixed(1)}h`;
}

export function formatPricingQuoteSubmittedUtc(createdUtc: string): string {
  const parsed = Date.parse(createdUtc);

  if (Number.isNaN(parsed)) {
    return createdUtc;
  }

  return new Date(parsed).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function resolvePricingQuoteSlaBadge(row: PricingQuoteAgingRow): PricingQuoteSlaBadge {
  if (row.firstResponseUtc !== null && row.firstResponseUtc.trim().length > 0) {
    return "Contacted";
  }

  if (row.breachStatus === "breach at 24h") {
    return "Past SLA";
  }

  if (row.breachStatus === "warn at 18h") {
    return "Follow up soon";
  }

  if (row.ageHours < NEW_REQUEST_MAX_AGE_HOURS) {
    return "New";
  }

  return "On track";
}

export function pricingQuoteSlaBadgeClass(badge: PricingQuoteSlaBadge): string {
  switch (badge) {
    case "New":
      return "border-sky-300 text-sky-900 dark:border-sky-800 dark:text-sky-100";
    case "On track":
      return "border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-200";
    case "Follow up soon":
      return "border-amber-400 text-amber-950 dark:border-amber-700 dark:text-amber-100";
    case "Past SLA":
      return "border-rose-400 text-rose-900 dark:border-rose-700 dark:text-rose-100";
    case "Contacted":
      return "border-neutral-300 text-neutral-600 dark:border-neutral-600 dark:text-neutral-400";
    default: {
      const exhaustive: never = badge;

      return exhaustive;
    }
  }
}

export function resolvePricingQuoteFollowUpStatus(row: PricingQuoteAgingRow): string {
  if (row.firstResponseUtc !== null && row.firstResponseUtc.trim().length > 0) {
    return "Contacted";
  }

  if (row.assignedOwner !== null && row.assignedOwner.trim().length > 0) {
    return "Assigned — outreach pending";
  }

  return "Awaiting assignment";
}

export function resolvePricingQuoteOwnerLabel(row: PricingQuoteAgingRow): string {
  const owner = row.assignedOwner?.trim();

  if (owner === undefined || owner.length === 0) {
    return "Unassigned";
  }

  return owner;
}

export function resolvePricingQuoteLastTouchLabel(row: PricingQuoteAgingRow): string {
  const touched = row.firstResponseUtc?.trim();

  if (touched === undefined || touched.length === 0) {
    return "—";
  }

  return formatPricingQuoteSubmittedUtc(touched);
}

export function countUnassignedPricingQuoteRows(rows: readonly PricingQuoteAgingRow[]): number {
  return rows.filter((row) => {
    const owner = row.assignedOwner?.trim();

    return owner === undefined || owner.length === 0;
  }).length;
}

export function resolveOldestPricingQuoteAgeHours(rows: readonly PricingQuoteAgingRow[]): number | null {
  if (rows.length === 0) {
    return null;
  }

  return rows.reduce((oldest, row) => Math.max(oldest, row.ageHours), 0);
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export function resolvePricingQuoteFollowUpHeadline(data: PricingQuoteAgingDashboard): PricingQuoteFollowUpHeadline {
  if (data.breachCount > 0) {
    return {
      message: `${data.breachCount} ${pluralize(data.breachCount, "request", "requests")} past follow-up SLA`,
      tone: "breach",
    };
  }

  if (data.warnCount > 0) {
    return {
      message: `${data.warnCount} ${pluralize(data.warnCount, "request", "requests")} nearing follow-up SLA`,
      tone: "warn",
    };
  }

  if (data.rows.length === 0) {
    return {
      message: "No open pricing quote requests",
      tone: "healthy",
    };
  }

  return {
    message: "All open requests are within follow-up SLA",
    tone: "healthy",
  };
}

export function buildPricingQuoteFollowUpSummaryTiles(
  data: PricingQuoteAgingDashboard,
): readonly PricingQuoteFollowUpSummaryTile[] {
  const unassignedCount = countUnassignedPricingQuoteRows(data.rows);
  const oldestAgeHours = resolveOldestPricingQuoteAgeHours(data.rows);

  return [
    {
      id: "open",
      label: "Open requests",
      value: String(data.rows.length),
      tone: data.rows.length > 0 ? "neutral" : "healthy",
    },
    {
      id: "warn",
      label: "Needs follow-up soon",
      value: String(data.warnCount),
      tone: data.warnCount > 0 ? "attention" : "healthy",
    },
    {
      id: "breach",
      label: "Past SLA",
      value: String(data.breachCount),
      tone: data.breachCount > 0 ? "breach" : "healthy",
    },
    {
      id: "oldest",
      label: "Oldest request age",
      value: oldestAgeHours === null ? "—" : formatPricingQuoteAgeHours(oldestAgeHours),
      tone: oldestAgeHours !== null && oldestAgeHours >= PRICING_QUOTE_SLA_WARN_HOURS ? "attention" : "neutral",
    },
    {
      id: "unassigned",
      label: "Unassigned requests",
      value: String(unassignedCount),
      tone: unassignedCount > 0 ? "attention" : "healthy",
    },
  ];
}

export function pricingQuoteFollowUpSummaryTileToneClass(
  tone: PricingQuoteFollowUpSummaryTile["tone"],
): string {
  switch (tone) {
    case "healthy":
      return "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30";
    case "attention":
      return "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30";
    case "breach":
      return "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/30";
    default:
      return "border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900";
  }
}

export function pricingQuoteFollowUpHeadlineSurfaceClass(tone: PricingQuoteFollowUpHeadlineTone): string {
  switch (tone) {
    case "breach":
      return "border-rose-300 bg-rose-50/80 text-rose-950 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100";
    case "warn":
      return "border-amber-300 bg-amber-50/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100";
    default:
      return "border-emerald-300 bg-emerald-50/70 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100";
  }
}
