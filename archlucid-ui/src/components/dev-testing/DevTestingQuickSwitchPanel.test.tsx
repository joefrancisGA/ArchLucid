import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DevTestingQuickSwitchPanel } from "@/components/dev-testing/DevTestingQuickSwitchPanel";
import {
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

describe("DevTestingQuickSwitchPanel", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    document.cookie = `${DEV_SHELL_EXPERIENCE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${DEV_ROLE_OVERRIDE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
    vi.mocked(reloadAfterDevTestingOverrideChange).mockClear();
  });

  it("renders shell and role override buttons in development", async () => {
    render(<DevTestingQuickSwitchPanel />);

    expect(await screen.findByTestId("dev-testing-quick-switch")).toBeInTheDocument();
    expect(screen.getByTestId("dev-shell-option-buyer-polished")).toBeInTheDocument();
    expect(screen.getByTestId("dev-role-option-Reader")).toBeInTheDocument();
  });

  it("persists a shell override and reloads", async () => {
    render(<DevTestingQuickSwitchPanel />);

    await screen.findByTestId("dev-testing-quick-switch");
    fireEvent.click(screen.getByTestId("dev-shell-option-full-operator"));

    expect(reloadAfterDevTestingOverrideChange).toHaveBeenCalledTimes(1);
  });
});
