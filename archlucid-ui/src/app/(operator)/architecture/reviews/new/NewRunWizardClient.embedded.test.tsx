import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useSearchParams: () => new URLSearchParams(),
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), forward: vi.fn() }),
    usePathname: () => "",
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

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

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

describe("NewRunWizardClient (embedded in path switcher)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("leads with template entry and defers stepper chrome on step 0 (TB-1868)", async () => {
    window.localStorage.setItem(WIZARD_MODE_STORAGE_KEY, "quick");

    render(<NewRunWizardClient embeddedInPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("reviews-new-detailed-template-entry")).toBeInTheDocument();
    });

    expect(screen.getByTestId("wizard-start-blank")).toBeInTheDocument();
    expect(screen.queryByTestId("new-run-wizard-progress")).not.toBeInTheDocument();
    expect(screen.queryByTestId("new-run-wizard-mode-toggle")).not.toBeInTheDocument();
  });

  it("uses panel-only shell without nested OperatorPageContainer (TB-1869)", async () => {
    render(<NewRunWizardClient embeddedInPathSwitcher />);

    await waitFor(() => {
      expect(screen.getByTestId("new-run-wizard-panel")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("operator-page-container")).not.toBeInTheDocument();
  });
});
