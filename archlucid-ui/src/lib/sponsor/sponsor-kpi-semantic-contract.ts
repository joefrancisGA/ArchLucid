import contractJson from "../../../../docs/library/EXECUTIVE_KPI_SEMANTIC_CONTRACT.json";

/** TB-168: server-authoritative sponsor KPI field contract (display/formatting only in UI). */
export type SponsorKpiSemanticField = {
  readonly id: string;
  readonly dtoField: string;
  readonly forbiddenUiPatterns?: readonly string[];
  readonly freshness: string;
  readonly uiSource?: string;
};

export type SponsorKpiSemanticContract = {
  readonly schemaVersion: number;
  readonly fields: readonly SponsorKpiSemanticField[];
};

export const SPONSOR_KPI_SEMANTIC_CONTRACT = contractJson as SponsorKpiSemanticContract;

/** Patterns that must not appear in production sponsor dashboard KPI wiring. */
export const SPONSOR_KPI_DASHBOARD_FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /expiringWaiversCount14Days\s*\?\?/,
  /waiversExpiringWithin14Days\s*\+/,
  /pendingApprovals\s*\+\s*staleRisks/,
  /addDays\s*\(\s*14\s*\)/i,
  /\.filter\s*\(\s*\(?\s*waiver/i,
];

export function listDashboardForbiddenPatternOffenders(source: string): string[] {
  return SPONSOR_KPI_DASHBOARD_FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(source)).map(
    (pattern) => pattern.source,
  );
}
