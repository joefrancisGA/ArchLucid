import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

vi.mock("@/components/tenancy/TenantMigrationMaintenanceBanner", () => ({
  TenantMigrationMaintenanceBanner: () => <div data-testid="tenant-migration-maintenance-banner" />,
}));

vi.mock("@/components/cto-demo/CtoDemoStaticFallbackPresenterBanner", () => ({
  CtoDemoStaticFallbackPresenterBanner: () => null,
}));

vi.mock("@/components/governance/ServiceBusHealthBanner", () => ({
  ServiceBusHealthBanner: () => null,
}));

vi.mock("@/components/LlmBudgetApproachingLimitBanner", () => ({
  LlmBudgetApproachingLimitBanner: () => null,
}));

vi.mock("@/components/TrialAiBudgetStatusBanner", () => ({
  PublicDemoAiUsageBanner: () => null,
  TrialAiBudgetStatusBanner: () => null,
}));

vi.mock("@/components/TeamExpansionNudge", () => ({
  TeamExpansionNudge: () => null,
}));

vi.mock("@/components/TrialBanner", () => ({
  TrialBanner: () => null,
}));

vi.mock("@/components/TrialExpiryBanner", () => ({
  TrialExpiryBanner: () => null,
}));

vi.mock("@/components/TrialUsageUpgradeNudge", () => ({
  TrialUsageUpgradeNudge: () => null,
}));

vi.mock("@/components/usability/PersistentTrialStatusStrip", () => ({
  PersistentTrialStatusStrip: () => null,
}));

vi.mock("@/components/usability/SetupHealthShellBanner", () => ({
  SetupHealthShellBanner: () => null,
}));

import { AppShellStatusBanners } from "@/components/shell/AppShellStatusBanners";

describe("AppShellStatusBanners", () => {
  it("includes tenant migration maintenance banner for minimal and full variants", () => {
    const { rerender } = render(<AppShellStatusBanners variant="minimal" />);

    expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();

    rerender(<AppShellStatusBanners variant="full" />);

    expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();
  });
});
