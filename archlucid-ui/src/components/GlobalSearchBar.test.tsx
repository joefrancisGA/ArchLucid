import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GlobalSearchBar, FOCUS_GLOBAL_SEARCH_EVENT } from "@/components/GlobalSearchBar";
import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  GLOBAL_SEARCH_ARIA_LABEL,
  GLOBAL_SEARCH_PLACEHOLDER,
  globalSearchInputTitle,
} from "@/lib/keyboard-shortcut-display";
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/lib/shortcut-registry";

const navigationTestState = vi.hoisted(() => ({
  pathname: "/",
  search: "",
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    usePathname: () => navigationTestState.pathname,
    useSearchParams: () => new URLSearchParams(navigationTestState.search),
    useRouter: () => ({ push: navigationTestState.push, replace: navigationTestState.replace }),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (opts: RequestInit) => opts,
}));

const architectWorkspaceChromeMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/hooks/useArchitectWorkspaceChrome", () => ({
  useArchitectWorkspaceChrome: () => architectWorkspaceChromeMock.value,
}));

describe("GlobalSearchBar", () => {
  beforeEach(() => {
    navigationTestState.pathname = "/";
    navigationTestState.search = "";
    navigationTestState.push.mockReset();
    navigationTestState.replace.mockReset();
    architectWorkspaceChromeMock.value = false;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ runs: [], findings: [], policyPacks: [] }),
      }),
    );
  });

  it("uses a lightweight search input without an embedded shortcut chip", () => {
    render(<GlobalSearchBar />);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });

    expect(input).toBeInTheDocument();
    expect(screen.getByPlaceholderText(GLOBAL_SEARCH_PLACEHOLDER)).toBe(input);
    expect(input).toHaveAttribute("title", globalSearchInputTitle());
    expect(input).toHaveAttribute("aria-keyshortcuts", COMMAND_PALETTE_ARIA_KEYSHORTCUTS);
    expect(input).toHaveAttribute("aria-describedby");
    expect(screen.getByText(GLOBAL_FIND_PAGE_SEARCH.helper)).toBeInTheDocument();
    expect(screen.queryByTestId("global-search-command-palette-hint")).toBeNull();
    expect(screen.queryByText("Ctrl+K")).toBeNull();
  });

  it("does not replace the URL while rendering a closed search bar", () => {
    render(<GlobalSearchBar />);

    expect(screen.queryByTestId("global-search-quick-actions")).not.toBeInTheDocument();
    expect(navigationTestState.replace).not.toHaveBeenCalled();
  });

  it("opens the quick-actions panel from the globalSearchOpen query param", () => {
    navigationTestState.search = "globalSearchOpen=1";

    render(<GlobalSearchBar />);

    expect(screen.getByTestId("global-search-quick-actions")).toBeInTheDocument();
    expect(navigationTestState.replace).not.toHaveBeenCalled();
  });

  it("exposes the quick-actions popup as a dialog rather than a listbox", async () => {
    render(<GlobalSearchBar />);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });
    fireEvent.focus(input);

    const popup = screen.getByTestId("global-search-quick-actions");
    expect(popup).toHaveAttribute("role", "dialog");
    expect(input).toHaveAttribute("aria-haspopup", "dialog");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-controls", popup.id);
    await waitFor(() => {
      expect(navigationTestState.replace).toHaveBeenCalledWith("/?globalSearchOpen=1", { scroll: false });
    });
  });

  it("closes the panel and clears globalSearchOpen after an outside click", async () => {
    navigationTestState.search = "globalSearchOpen=1";

    render(<GlobalSearchBar />);

    expect(screen.getByTestId("global-search-quick-actions")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByTestId("global-search-quick-actions")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(navigationTestState.replace).toHaveBeenCalledWith("/", { scroll: false });
    });
  });

  it("closes the panel when globalSearchOpen is removed from the URL", () => {
    navigationTestState.search = "globalSearchOpen=1";
    const view = render(<GlobalSearchBar />);

    expect(screen.getByTestId("global-search-quick-actions")).toBeInTheDocument();

    navigationTestState.search = "";
    view.rerender(<GlobalSearchBar />);

    expect(screen.queryByTestId("global-search-quick-actions")).not.toBeInTheDocument();
    expect(navigationTestState.replace).not.toHaveBeenCalled();
  });

  it("opens the results panel when the query is long enough", async () => {
    render(<GlobalSearchBar />);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });
    fireEvent.change(input, { target: { value: "ab" } });

    expect(await screen.findByRole("listbox")).toBeInTheDocument();
  });

  it("focuses the input when the find-a-page hash changes", async () => {
    render(<GlobalSearchBar />);

    window.location.hash = "find-a-page";
    fireEvent(window, new HashChangeEvent("hashchange"));

    await vi.waitFor(() => {
      expect(screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL })).toHaveFocus();
    });
  });

  it("focuses the input when FOCUS_GLOBAL_SEARCH_EVENT is dispatched", () => {
    render(<GlobalSearchBar />);

    window.dispatchEvent(new Event(FOCUS_GLOBAL_SEARCH_EVENT));

    expect(screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL })).toHaveFocus();
  });

  it("shows untitled review instead of raw run id when description is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          runs: [{ runId: "run-abc-123", description: "" }],
          findings: [],
          policyPacks: [],
        }),
      }),
    );

    render(<GlobalSearchBar />);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });
    fireEvent.change(input, { target: { value: "ab" } });

    expect(await screen.findByRole("button", { name: "Untitled review" })).toBeInTheDocument();
    expect(screen.queryByText("run-abc-123")).not.toBeInTheDocument();
  });

  it("shows canonical severity tags for finding hits", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          runs: [],
          findings: [{ runId: "run-1", findingId: "f-1", title: "Open egress path", severity: "Critical" }],
          policyPacks: [],
        }),
      }),
    );

    render(<GlobalSearchBar />);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });
    fireEvent.change(input, { target: { value: "ab" } });

    expect(await screen.findByLabelText("Severity: Critical")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open egress path/ })).toBeInTheDocument();
  });

  it("shows a retryable error when the search API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({}),
      }),
    );

    render(<GlobalSearchBar />);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });
    fireEvent.change(input, { target: { value: "ab" } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Search is temporarily unavailable.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("No matches.")).not.toBeInTheDocument();
    expect(screen.queryByText(/No pages, reviews, or findings matched/)).not.toBeInTheDocument();
  });

  it("dispatches the command palette with the current query on Ctrl+K", () => {
    render(<GlobalSearchBar />);

    const listener = vi.fn();
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, listener);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });
    fireEvent.change(input, { target: { value: "claims" } });
    fireEvent.keyDown(input, { key: "k", ctrlKey: true });

    expect(listener).toHaveBeenCalledTimes(1);
    expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ initialQuery: "claims" });

    window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, listener);
  });

  it("shows actionable guidance when search returns no matches", async () => {
    render(<GlobalSearchBar />);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });
    fireEvent.change(input, { target: { value: "zzxynomatch999" } });

    expect(await screen.findByText(/No pages, reviews, or findings matched/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "browse help topics" })).toHaveAttribute("href", "/help");
  });

  it("keeps review search scope chips inline with the input on review detail routes", () => {
    architectWorkspaceChromeMock.value = true;
    navigationTestState.pathname = "/architecture/reviews/run-abc";

    render(<GlobalSearchBar />);

    const controlRow = screen.getByTestId("global-search-control-row");
    const scopeToggle = screen.getByTestId("global-search-package-scope-toggle");
    const input = screen.getByRole("combobox", { name: "Search this review" });

    expect(controlRow).toHaveClass("flex-nowrap");
    expect(controlRow.contains(scopeToggle)).toBe(true);
    expect(controlRow.contains(input)).toBe(true);
    expect(scopeToggle.className).not.toContain("mt-1.5");
    expect(screen.getByTestId("global-search-scope-package")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("global-search-scope-workspace")).toHaveAttribute("aria-pressed", "false");
  });

  it("switches review search scope when the workspace chip is selected", () => {
    architectWorkspaceChromeMock.value = true;
    navigationTestState.pathname = "/architecture/reviews/run-abc";

    render(<GlobalSearchBar />);

    fireEvent.click(screen.getByTestId("global-search-scope-workspace"));

    expect(screen.getByRole("combobox", { name: "Search workspace" })).toBeInTheDocument();
    expect(screen.getByTestId("global-search-scope-workspace")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("global-search-scope-package")).toHaveAttribute("aria-pressed", "false");
  });
});
