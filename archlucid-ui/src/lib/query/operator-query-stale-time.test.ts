import { describe, expect, it } from "vitest";

import {
  OPERATOR_SHELL_LLM_BUDGET_ACTIVE_STALE_MS,
  OPERATOR_SHELL_LLM_BUDGET_STABLE_STALE_MS,
  OPERATOR_SHELL_MIGRATION_IDLE_STALE_MS,
  OPERATOR_SHELL_TRIAL_STABLE_STALE_MS,
  OPERATOR_QUERY_STALE_MS,
  resolveLlmMonthlyBudgetStatusStaleTime,
  resolveTenantCatalogMigrationStaleTime,
  resolveTenantTrialStatusStaleTime,
} from "@/lib/query/operator-query-stale-time";

describe("operator shell query stale-time helpers", () => {
  it("extends migration stale time when migration is idle", () => {
    expect(resolveTenantCatalogMigrationStaleTime({ inMigration: false })).toBe(
      OPERATOR_SHELL_MIGRATION_IDLE_STALE_MS,
    );
    expect(resolveTenantCatalogMigrationStaleTime({ inMigration: true })).toBe(OPERATOR_QUERY_STALE_MS);
  });

  it("extends trial stale time for converted or none lifecycle", () => {
    expect(resolveTenantTrialStatusStaleTime({ status: "None" })).toBe(
      OPERATOR_SHELL_TRIAL_STABLE_STALE_MS,
    );
    expect(resolveTenantTrialStatusStaleTime({ status: "Active" })).toBe(OPERATOR_QUERY_STALE_MS);
  });

  it("extends LLM budget stale time when monitoring is inactive", () => {
    expect(resolveLlmMonthlyBudgetStatusStaleTime({ monthlyBudgetMonitoringActive: false })).toBe(
      OPERATOR_SHELL_LLM_BUDGET_STABLE_STALE_MS,
    );
    expect(resolveLlmMonthlyBudgetStatusStaleTime({ monthlyBudgetMonitoringActive: true })).toBe(
      OPERATOR_SHELL_LLM_BUDGET_ACTIVE_STALE_MS,
    );
  });
});
