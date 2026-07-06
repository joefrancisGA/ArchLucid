import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GlobalSearchBar, FOCUS_GLOBAL_SEARCH_EVENT } from "@/components/GlobalSearchBar";
import { useSearchShortcut } from "@/hooks/useSearchShortcut";
import { GLOBAL_SEARCH_ARIA_LABEL } from "@/lib/keyboard-shortcut-display";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push: vi.fn() }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (opts: RequestInit) => opts,
}));

function SearchShortcutHarness(): React.JSX.Element {
  useSearchShortcut();

  return <GlobalSearchBar />;
}

describe("useSearchShortcut", () => {
  it("focuses global search when / is pressed outside editable fields", () => {
    render(<SearchShortcutHarness />);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });

    expect(document.activeElement).not.toBe(input);

    fireEvent.keyDown(document, { key: "/" });

    expect(document.activeElement).toBe(input);
  });

  it("does not intercept / while typing in an input", () => {
    render(
      <>
        <SearchShortcutHarness />
        <input aria-label="Notes" />
      </>,
    );

    const notes = screen.getByLabelText("Notes");
    notes.focus();

    const listener = vi.fn();
    window.addEventListener(FOCUS_GLOBAL_SEARCH_EVENT, listener);

    fireEvent.keyDown(notes, { key: "/" });

    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener(FOCUS_GLOBAL_SEARCH_EVENT, listener);
  });
});
