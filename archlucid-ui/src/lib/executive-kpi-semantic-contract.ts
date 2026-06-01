import contractJson from "../../../docs/library/EXECUTIVE_KPI_SEMANTIC_CONTRACT.json";

/** TB-168: server-authoritative executive KPI field contract (display/formatting only in UI). */
export type ExecutiveKpiSemanticField = {
  readonly id: string;
  readonly dtoField: string;
  readonly forbiddenUiPatterns?: readonly string[];
  readonly freshness: string;
  readonly uiSource?: string;
};

export type ExecutiveKpiSemanticContract = {
  readonly schemaVersion: number;
  readonly fields: readonly ExecutiveKpiSemanticField[];
};

export const EXECUTIVE_KPI_SEMANTIC_CONTRACT = contractJson as ExecutiveKpiSemanticContract;

/** Patterns that must not appear in production executive dashboard KPI wiring. */
export const EXECUTIVE_KPI_DASHBOARD_FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /expiringWaiversCount14Days\s*\?\?/,
  /waiversExpiringWithin14Days\s*\+/,
  /pendingApprovals\s*\+\s*staleRisks/,
  /addDays\s*\(\s*14\s*\)/i,
  /\.filter\s*\(\s*\(?\s*waiver/i,
];

export function listDashboardForbiddenPatternOffenders(source: string): string[] {
  return EXECUTIVE_KPI_DASHBOARD_FORBIDDEN_PATTERNS.filter((pattern) => pattern.test(source)).map(
    (pattern) => pattern.source,
  );
}
