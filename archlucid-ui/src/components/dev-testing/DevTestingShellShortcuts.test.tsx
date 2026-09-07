import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DevTestingShellShortcuts } from "@/components/dev-testing/DevTestingShellShortcuts";
import { DevTestingQuickSwitchPanel } from "@/components/dev-testing/DevTestingQuickSwitchPanel";
import {
  DEV_QUICK_SWITCH_PANEL_HIDDEN_STORAGE_KEY,
  DEV_ROLE_OVERRIDE_COOKIE,
  DEV_SHELL_EXPERIENCE_COOKIE,
  reloadAfterDevTestingOverrideChange,
} from "@/lib/dev-testing-overrides";

vi.mock("@/lib/dev-testing-overrides", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dev-testing-overrides")>();

  return {
    ...actual,
    reloadAfterDevTestingOverrideChange: vi.fn(),
  };
});

vi.mock("@/lib/load-dev-testing-quick-jump-snapshot", () => ({
  DEV_TESTING_QUICK_JUMP_MAX_ITEMS: 8,
  DEV_TESTING_QUICK_JUMP_MANIFEST_PROBE_RUNS: 4,
  DEV_TESTING_QUICK_JUMP_ARTIFACT_PROBE_MANIFESTS: 2,
  buildEmptyDevTestingQuickJumpSnapshot: (runIds: readonly string[]) => ({
    plans: [],
    runs: runIds.map((runId) => ({ runId })),
    approvalRequests: [],
    manifests: [],
    artifacts: [],
  }),
  loadDevTestingQuickJumpSnapshot: vi.fn(async () => ({
    plans: [],
    runs: [],
    approvalRequests: [],
    manifests: [],
    artifacts: [],
  })),
}));

describe("DevTestingShellShortcuts", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    localStorage.clear();
  });

  afterEach(() => {
    document.cookie = `${DEV_SHELL_EXPERIENCE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${DEV_ROLE_OVERRIDE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    localStorage.clear();
    vi.mocked(reloadAfterDevTestingOverrideChange).mockClear();
    vi.unstubAllEnvs();
  });

  it("toggles the dev quick-switch drawer with Alt+Shift+D", async () => {
    render(
      <>
        <DevTestingShellShortcuts />
        <DevTestingQuickSwitchPanel />
      </>,
    );

    expect(screen.queryByTestId("dev-testing-quick-switch")).toBeNull();

    fireEvent.keyDown(window, { key: "D", altKey: true, shiftKey: true });

    expect(await screen.findByTestId("dev-testing-quick-switch")).toBeInTheDocument();
    expect(localStorage.getItem(DEV_QUICK_SWITCH_PANEL_HIDDEN_STORAGE_KEY)).toBe("0");

    fireEvent.keyDown(window, { key: "D", altKey: true, shiftKey: true });

    await waitFor(() => {
      expect(screen.queryByTestId("dev-testing-quick-switch")).toBeNull();
    });

    expect(localStorage.getItem(DEV_QUICK_SWITCH_PANEL_HIDDEN_STORAGE_KEY)).toBe("1");
  });
});
