import { render, screen, waitFor, type ReactNode } from "@testing-library/react";
import { createElement, useSyncExternalStore } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const wizardPilotSearchParamsHarness = vi.hoisted(() => {
  const listeners = new Set<() => void>();
  const state = { query: "" };

  return {
    state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    applyHref(href: string): void {
      try {
        const url = new URL(href, "http://localhost/");
        state.query = url.search.startsWith("?") ? url.search.slice(1) : url.search;
      } catch {
        const qIndex = href.indexOf("?");
        state.query = qIndex >= 0 ? href.slice(qIndex + 1) : "";
      }

      for (const listener of listeners) {
        listener();
      }
    },
    reset(): void {
      state.query = "";
    },
  };
});

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => wizardPilotSearchParamsHarness.state.query,
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      wizardPilotSearchParamsHarness.applyHref(href);

      return true;
    },
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useSearchParams: () => new URLSearchParams(wizardPilotSearchParamsHarness.state.query),
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

const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

function WizardPilotSearchParamsRerenderHost({ children }: { readonly children: ReactNode }) {
  useSyncExternalStore(
    wizardPilotSearchParamsHarness.subscribe,
    () => wizardPilotSearchParamsHarness.state.query,
    () => "",
  );

  return createElement("div", null, children);
}

describe("NewRunWizardClient advancedConfig URL sync", () => {
  beforeEach(() => {
    wizardPilotSearchParamsHarness.reset();
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.removeItem(WIZARD_MODE_STORAGE_KEY);
  });

  it("follows advancedConfig= URL changes without a popstate event", async () => {
    wizardPilotSearchParamsHarness.state.query = "advancedConfig=1";

    const view = render(
      <WizardPilotSearchParamsRerenderHost>
        <NewRunWizardClient />
      </WizardPilotSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading wizard…")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("new-run-wizard-mode-toggle")).toBeInTheDocument();
    });

    wizardPilotSearchParamsHarness.applyHref("/architecture/reviews/new");
    view.rerender(
      <WizardPilotSearchParamsRerenderHost>
        <NewRunWizardClient />
      </WizardPilotSearchParamsRerenderHost>,
    );

    await waitFor(() => {
      expect(screen.queryByTestId("new-run-wizard-mode-toggle")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("new-run-wizard-advanced-opt-in")).toBeInTheDocument();
  });
});
