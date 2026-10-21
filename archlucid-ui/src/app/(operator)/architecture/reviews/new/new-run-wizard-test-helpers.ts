import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, vi } from "vitest";

import "@testing-library/jest-dom/vitest";

import { GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL } from "@/lib/guided-intake-copy";
import {
  buildWizardSessionStorageKey,
  WIZARD_SESSION_IDS,
} from "@/lib/wizard-session-persistence";

const newRunWizardUrlHarness = vi.hoisted(() => {
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
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
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
      window.history.replaceState(null, "", "/architecture/reviews/new");
    },
  };
});

/** Reset URL navigation harness between tests (step query must not leak across files). */
export function resetNewRunWizardVitestNavigation(): void {
  newRunWizardUrlHarness.reset();
}

/** Clear persisted full-wizard step snapshots that would restore a non-zero step index. */
export function clearNewRunWizardVitestSessionSnapshot(): void {
  window.sessionStorage.removeItem(buildWizardSessionStorageKey(WIZARD_SESSION_IDS.reviewsNewTemplates));
}

/** Call from NewRunWizardClient vitest `beforeEach` hooks. */
export function prepareNewRunWizardVitestHarness(): void {
  resetNewRunWizardVitestNavigation();
  clearNewRunWizardVitestSessionSnapshot();
}

vi.mock("@/lib/navigation/replace-if-href-changed", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/navigation/replace-if-href-changed")>();

  return {
    ...actual,
    readWindowLocationSearch: () => newRunWizardUrlHarness.state.query,
    commitHrefIfChanged: (href: string, _options?: { readonly notify?: boolean }) => {
      newRunWizardUrlHarness.applyHref(href);

      return true;
    },
  };
});

/** Wizard identity step label (shared across full and quick-start wizards). */
export const NEW_RUN_WIZARD_SYSTEM_NAME_LABEL = GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL;

/** Opt into advanced wizard configuration before tests that need the mode toggle. */
export async function optIntoAdvancedNewRunWizardConfiguration(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByText("Loading wizard…")).not.toBeInTheDocument();
  });

  await act(async () => {
    fireEvent.click(
      screen.getByRole("button", { name: "Show all wizard steps (advanced configuration)" }),
    );
  });

  await waitFor(() => {
    expect(screen.getByTestId("new-run-wizard-mode-toggle")).toBeInTheDocument();
  });
}
