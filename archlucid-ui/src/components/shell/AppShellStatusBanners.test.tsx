import { describe, expect, it, vi } from "vitest";

import { render, screen } from "@testing-library/react";

vi.mock("@/components/operator/OperatorOfflineReconnectBanner", () => ({
  OperatorOfflineReconnectBanner: () => <div data-testid="operator-offline-reconnect" />,
}));

vi.mock("@/components/tenancy/TenantMigrationMaintenanceBanner", () => ({
  TenantMigrationMaintenanceBanner: () => <div data-testid="tenant-migration-maintenance-banner" />,
}));

vi.mock("@/components/cto-demo/CtoDemoStaticFallbackPresenterBanner", () => ({
  CtoDemoStaticFallbackPresenterBanner: () => null,
}));

vi.mock("@/components/governance/ServiceBusHealthBanner", () => ({
  ServiceBusHealthBanner: () => null,
}));

vi.mock("@/components/llm/LlmBudgetApproachingLimitBanner", () => ({
  LlmBudgetApproachingLimitBanner: () => null,
}));

vi.mock("@/components/trial/TrialAiBudgetStatusBanner", () => ({
  PublicDemoAiUsageBanner: () => null,
  TrialAiBudgetStatusBanner: () => null,
}));

vi.mock("@/components/TeamExpansionNudge", () => ({
  TeamExpansionNudge: () => null,
}));

vi.mock("@/components/trial/TrialBanner", () => ({
  TrialBanner: () => null,
}));

vi.mock("@/components/trial/TrialExpiryBanner", () => ({
  TrialExpiryBanner: () => null,
}));

vi.mock("@/components/trial/TrialUsageUpgradeNudge", () => ({
  TrialUsageUpgradeNudge: () => null,
}));

vi.mock("@/components/usability/PersistentTrialStatusStrip", () => ({
  PersistentTrialStatusStrip: () => null,
}));

vi.mock("@/components/usability/SetupHealthShellBanner", () => ({
  SetupHealthShellBanner: () => null,
}));

import { AppShellStatusBanners } from "@/components/shell/AppShellStatusBanners";

vi.mock("@/hooks/use-review-presenter-chrome-active", () => ({
  useReviewPresenterChromeActive: vi.fn(() => false),
}));

import { useReviewPresenterChromeActive } from "@/hooks/use-review-presenter-chrome-active";

const mockUseReviewPresenterChromeActive = vi.mocked(useReviewPresenterChromeActive);

describe("AppShellStatusBanners", () => {
  it("renders nothing in presenter mode (WA-21)", () => {
    mockUseReviewPresenterChromeActive.mockReturnValue(true);

    const { container } = render(<AppShellStatusBanners variant="full" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("includes offline reconnect and tenant migration banners for minimal and full variants", () => {
    mockUseReviewPresenterChromeActive.mockReturnValue(false);
    const { rerender } = render(<AppShellStatusBanners variant="minimal" />);

    expect(screen.getByTestId("operator-offline-reconnect")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();

    rerender(<AppShellStatusBanners variant="full" />);

    expect(screen.getByTestId("operator-offline-reconnect")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();
  });
});
