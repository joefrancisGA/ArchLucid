import { describe, expect, it } from "vitest";

import {
  resolveShellBannerPollIntervalMs,
  shouldPollCatalogMigrationBanner,
  shouldPollLlmBudgetApproachingBanner,
  shouldPollLlmMonthlyBudgetStatus,
  shouldPollTrialAiBudgetBanner,
} from "@/lib/shell-banner-poll-policy";

describe("shell banner poll policy (TB-2029)", () => {
  it("polls trial budget only for active remaining-budget banners", () => {
    expect(
      shouldPollTrialAiBudgetBanner({
        monthlyBudgetMonitoringActive: true,
        workspaceKind: "Trial",
        remainingBudgetUsd: 12.5,
      } as never),
    ).toBe(true);

    expect(
      shouldPollTrialAiBudgetBanner({
        monthlyBudgetMonitoringActive: true,
        workspaceKind: "Paid",
        remainingBudgetUsd: 12.5,
      } as never),
    ).toBe(false);
  });

  it("polls LLM warn banner while monthly monitoring is active", () => {
    expect(
      shouldPollLlmBudgetApproachingBanner({
        monthlyBudgetMonitoringActive: true,
        monthlyBudgetUsd: 100,
        monthToDateSpendUsd: 10,
        warnFraction: 0.75,
      } as never),
    ).toBe(true);

    expect(
      shouldPollLlmBudgetApproachingBanner({
        monthlyBudgetMonitoringActive: false,
        monthlyBudgetUsd: 100,
        monthToDateSpendUsd: 80,
        warnFraction: 0.75,
      } as never),
    ).toBe(false);
  });

  it("pauses shell banner polling when the tab is hidden", () => {
    expect(
      resolveShellBannerPollIntervalMs({
        enabled: true,
        documentHidden: true,
        shouldPoll: true,
      }),
    ).toBe(false);
  });

  it("polls catalog migration only while migration is active", () => {
    expect(shouldPollCatalogMigrationBanner({ inMigration: true })).toBe(true);
    expect(shouldPollCatalogMigrationBanner({ inMigration: false })).toBe(false);
    expect(shouldPollCatalogMigrationBanner(undefined)).toBe(false);
  });

  it("combines shell LLM budget poll signals for the single poll owner", () => {
    expect(
      shouldPollLlmMonthlyBudgetStatus({
        monthlyBudgetMonitoringActive: true,
        workspaceKind: "Trial",
        customerAiProviderConfigured: false,
      } as never),
    ).toBe(true);

    expect(
      shouldPollLlmMonthlyBudgetStatus({
        monthlyBudgetMonitoringActive: false,
      } as never),
    ).toBe(false);
  });
});
