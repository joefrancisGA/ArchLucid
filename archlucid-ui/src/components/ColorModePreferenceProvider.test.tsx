import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ColorModePreferenceProvider } from "@/components/ColorModePreferenceProvider";
import { ThemePreferenceSelector } from "@/components/ThemePreferenceSelector";
import { COLOR_MODE_STORAGE_KEY } from "@/lib/color-mode-preference";

vi.mock("@/lib/api/user-preferences", () => ({
  getUserPreferences: vi.fn().mockRejectedValue(new Error("anonymous")),
  setUserAppearancePreference: vi.fn().mockResolvedValue(undefined),
  invalidateUserPreferencesCache: vi.fn(),
}));

type MatchMediaController = {
  readonly setMatches: (matches: boolean) => void;
  readonly listenerCount: () => number;
  readonly dispose: () => void;
};

function installMatchMedia(initialMatches: boolean): MatchMediaController {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = initialMatches;

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query.includes("prefers-color-scheme") ? matches : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => true,
    addListener: () => undefined,
    removeListener: () => undefined,
  })) as typeof window.matchMedia;

  return {
    setMatches(nextMatches: boolean) {
      matches = nextMatches;
      const event = { matches: nextMatches } as MediaQueryListEvent;

      listeners.forEach((listener) => listener(event));
    },
    listenerCount() {
      return listeners.size;
    },
    dispose() {
      listeners.clear();
    },
  };
}

function renderThemeSelector() {
  return render(
    <ColorModePreferenceProvider>
      <ThemePreferenceSelector />
    </ColorModePreferenceProvider>,
  );
}

describe("ColorModePreferenceProvider", () => {
  let matchMediaController: MatchMediaController | null = null;

  afterEach(() => {
    document.documentElement.classList.remove("dark");
    matchMediaController?.dispose();
    matchMediaController = null;

    try {
      window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    }
    catch {
      // ignore
    }
  });

  it("resolves system to dark when the device prefers dark", async () => {
    matchMediaController = installMatchMedia(true);
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "system");

    renderThemeSelector();

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("system");
  });

  it("reacts when prefers-color-scheme changes while system is selected", async () => {
    matchMediaController = installMatchMedia(false);
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "system");

    renderThemeSelector();

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    matchMediaController.setMatches(true);

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("system");
  });

  it("keeps explicit light when the operating system switches to dark", async () => {
    matchMediaController = installMatchMedia(false);
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "light");

    renderThemeSelector();

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    matchMediaController.setMatches(true);

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  it("stores system preference without rewriting it to dark when selecting system on a dark device", async () => {
    matchMediaController = installMatchMedia(true);
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "light");

    renderThemeSelector();

    const systemOption = await waitFor(() => document.getElementById("theme-preference-system") as HTMLInputElement);

    fireEvent.click(systemOption);

    expect(systemOption).toBeChecked();
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes the media-query listener on unmount", async () => {
    matchMediaController = installMatchMedia(false);
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "system");

    const view = renderThemeSelector();

    await waitFor(() => {
      expect(matchMediaController?.listenerCount()).toBe(1);
    });

    view.unmount();

    expect(matchMediaController?.listenerCount()).toBe(0);
  });
});

describe("ThemePreferenceSelector", () => {
  afterEach(() => {
    document.documentElement.classList.remove("dark");

    try {
      window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    }
    catch {
      // ignore
    }
  });

  it("renders accessible radio-card theme options", async () => {
    renderThemeSelector();

    await waitFor(() => {
      expect(screen.getByTestId("theme-preference-option-system")).toBeInTheDocument();
    });

    expect(screen.getByRole("radio", { name: /System/i })).toBeInTheDocument();
  });
});
