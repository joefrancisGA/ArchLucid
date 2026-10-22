import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShellIdleOverlays } from "@/components/shell/AppShellIdleOverlays";

vi.mock("@/hooks/use-app-shell-idle-overlays-ready", () => ({
  useAppShellIdleOverlaysReady: vi.fn(() => false),
}));

vi.mock("@/components/CorePilotWizard", () => ({
  CorePilotWizardLauncher: () => <div data-testid="core-pilot-wizard-launcher" />,
}));

vi.mock("@/components/PilotBaselineWizardLauncher", () => ({
  PilotBaselineWizardLauncher: () => <div data-testid="pilot-baseline-wizard-launcher" />,
}));

describe("AppShellIdleOverlays", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not mount wizard overlays before idle readiness", () => {
    render(<AppShellIdleOverlays />);

    expect(screen.queryByTestId("core-pilot-wizard-launcher")).toBeNull();
    expect(screen.queryByTestId("pilot-baseline-wizard-launcher")).toBeNull();
  });
});
