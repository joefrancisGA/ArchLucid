import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GlobalSearchBar, FOCUS_GLOBAL_SEARCH_EVENT } from "@/components/GlobalSearchBar";
import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  GLOBAL_SEARCH_ARIA_LABEL,
  GLOBAL_SEARCH_PLACEHOLDER,
  globalSearchInputTitle,
} from "@/lib/keyboard-shortcut-display";
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";

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

describe("GlobalSearchBar", () => {
  beforeEach(() => {
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

  it("shows actionable guidance when search returns no matches", async () => {
    render(<GlobalSearchBar />);

    const input = screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL });
    fireEvent.change(input, { target: { value: "zzxynomatch999" } });

    expect(await screen.findByText(/No pages, reviews, or findings matched/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "browse help topics" })).toHaveAttribute("href", "/help");
  });
});
