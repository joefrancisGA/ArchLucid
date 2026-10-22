import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  shouldShowExecutionModeTopBarChip,
  toggleDevAgentExecutionModeFromChip,
} from "@/lib/execution-mode-top-bar-chip";

const devOverrides = vi.hoisted(() => ({
  persist: vi.fn(),
  reload: vi.fn(),
  readOverride: vi.fn<() => "Real" | "Simulator" | null>(() => null),
  devEnabled: true,
}));

vi.mock("@/lib/dev-testing-overrides", () => ({
  isDevTestingOverridesEnabled: () => devOverrides.devEnabled,
  persistDevAgentExecutionModeOverride: (value: "Real" | "Simulator" | null) => {
    devOverrides.persist(value);
  },
  readDevAgentExecutionModeOverrideFromDocument: () => devOverrides.readOverride(),
  reloadAfterDevTestingOverrideChange: () => {
    devOverrides.reload();
  },
}));

describe("execution-mode-top-bar-chip", () => {
  beforeEach(() => {
    devOverrides.persist.mockClear();
    devOverrides.reload.mockClear();
    devOverrides.readOverride.mockReturnValue(null);
    devOverrides.devEnabled = true;
  });

  describe("shouldShowExecutionModeTopBarChip", () => {
    it("hides while loading", () => {
      expect(
        shouldShowExecutionModeTopBarChip({
          isLoading: true,
          hostAgentExecutionMode: "Simulator",
        }),
      ).toBe(false);
    });

    it("shows when the host starts in simulator mode", () => {
      expect(
        shouldShowExecutionModeTopBarChip({
          isLoading: false,
          hostAgentExecutionMode: "Simulator",
          devOverride: null,
        }),
      ).toBe(true);
    });

    it("hides when the host starts in real mode with no override", () => {
      expect(
        shouldShowExecutionModeTopBarChip({
          isLoading: false,
          hostAgentExecutionMode: "Real",
          devOverride: null,
        }),
      ).toBe(false);
    });

    it("shows when a dev override cookie is present even if the host is real", () => {
      expect(
        shouldShowExecutionModeTopBarChip({
          isLoading: false,
          hostAgentExecutionMode: "Real",
          devOverride: "Simulator",
        }),
      ).toBe(true);
    });
  });

  describe("toggleDevAgentExecutionModeFromChip", () => {
    it("persists Real and reloads when leaving simulator mode", () => {
      toggleDevAgentExecutionModeFromChip("Simulator");

      expect(devOverrides.persist).toHaveBeenCalledWith("Real");
      expect(devOverrides.reload).toHaveBeenCalled();
    });

    it("persists Simulator and reloads when leaving real mode", () => {
      toggleDevAgentExecutionModeFromChip("Real");

      expect(devOverrides.persist).toHaveBeenCalledWith("Simulator");
      expect(devOverrides.reload).toHaveBeenCalled();
    });

    it("no-ops outside development", () => {
      devOverrides.devEnabled = false;

      toggleDevAgentExecutionModeFromChip("Simulator");

      expect(devOverrides.persist).not.toHaveBeenCalled();
      expect(devOverrides.reload).not.toHaveBeenCalled();
    });
  });
});
