import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
  usePathname: () => "/architecture/reviews/new",
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  createArchitectureRun: vi.fn(),
  getRunSummary: vi.fn(),
  listRunsByProjectPaged: vi.fn().mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    hasMore: false,
  }),
}));

vi.mock("@/lib/core-pilot-commit-context", async (importOriginal) => {
  const { createCorePilotCommitContextModuleMock } = await import("@/testing/core-pilot-commit-context.mock");

  return createCorePilotCommitContextModuleMock(importOriginal);
});

import { NewRunWizardClient } from "./NewRunWizardClient";

describe("NewRunWizardClient (first-run golden path)", () => {
  beforeEach(() => {
    window.localStorage.removeItem(WIZARD_MODE_STORAGE_KEY);
  });

  afterEach(() => {
    window.localStorage.removeItem(WIZARD_MODE_STORAGE_KEY);
  });

  it("shows quick-start guidance and defers advanced wizard toggle until opt-in", async () => {
    render(<NewRunWizardClient />);

    await waitFor(() => {
      expect(screen.queryByText("Loading wizard…")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("new-run-wizard-advanced-opt-in")).toBeInTheDocument();
    expect(screen.queryByTestId("new-run-wizard-mode-toggle")).not.toBeInTheDocument();
    expect(screen.getByTestId("core-pilot-progress-tracker")).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByTestId("quick-start-progress")).toBeInTheDocument();
      },
      { timeout: 15_000 },
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Show all wizard steps (advanced configuration)" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("new-run-wizard-mode-toggle")).toBeInTheDocument();
    });
  });
});
