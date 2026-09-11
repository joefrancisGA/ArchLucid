import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/components/workspace-mode/WorkingSimulatorCloneRehearsalBanner", () => ({
  WorkingSimulatorCloneRehearsalBanner: () => (
    <div data-testid="working-simulator-clone-rehearsal-banner" />
  ),
}));

import { AppShellStatusBanners } from "@/components/shell/AppShellStatusBanners";

vi.mock("@/hooks/use-review-presenter-chrome-active", () => ({
  useReviewPresenterChromeActive: vi.fn(() => false),
}));

const productLineMock = vi.hoisted(() => ({ value: "architecture" as "architecture" | "security" }));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: productLineMock.value }),
}));

import { useReviewPresenterChromeActive } from "@/hooks/use-review-presenter-chrome-active";

const mockUseReviewPresenterChromeActive = vi.mocked(useReviewPresenterChromeActive);

describe("AppShellStatusBanners", () => {
  beforeEach(() => {
    productLineMock.value = "architecture";
  });

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
    expect(screen.getByTestId("working-simulator-clone-rehearsal-banner")).toBeInTheDocument();

    rerender(<AppShellStatusBanners variant="full" />);

    expect(screen.getByTestId("operator-offline-reconnect")).toBeInTheDocument();
    expect(screen.getByTestId("tenant-migration-maintenance-banner")).toBeInTheDocument();
    expect(screen.getByTestId("working-simulator-clone-rehearsal-banner")).toBeInTheDocument();
  });

  it("hides the Simulator clone rehearsal banner in the SecureNow shell", () => {
    mockUseReviewPresenterChromeActive.mockReturnValue(false);
    productLineMock.value = "security";

    render(<AppShellStatusBanners variant="full" />);

    expect(screen.queryByTestId("working-simulator-clone-rehearsal-banner")).not.toBeInTheDocument();
  });
});
