import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const helpDocsNavigation = vi.hoisted(() => {
  const state = {
    params: new URLSearchParams(),
    replace: vi.fn((href: string) => {
      const queryIndex = href.indexOf("?");

      state.params = new URLSearchParams(queryIndex === -1 ? "" : href.slice(queryIndex + 1));
    }),
  };

  return state;
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/help",
  useRouter: () => ({ replace: helpDocsNavigation.replace, push: vi.fn() }),
  useSearchParams: () => helpDocsNavigation.params,
}));

import { renderWithOperatorQuery, useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";

import { HelpDocsClient } from "./HelpDocsClient";

describe("HelpDocsClient", () => {
  useOperatorQueryTestLifecycle();

  beforeEach(() => {
    helpDocsNavigation.params = new URLSearchParams();
    helpDocsNavigation.replace.mockClear();
  });

  it("does not list Admin-only internal-runbook titles from the shipped doc-index", async () => {
    // generate_doc_index.py used to bleed string titles from skipped runbook entries onto prior
    // public slugs when those slugs used TS constant titles (not string literals).
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const index = JSON.parse(readFileSync(join(process.cwd(), "public/doc-index.json"), "utf8")) as Array<{
      title: string;
      url: string;
    }>;

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => index,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Getting started" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "CLI usage" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Engineering troubleshooting runbook" })).toBeNull();

    const poisoned = index.filter(
      (row) =>
        row.title === "CLI usage" || row.title === "Engineering troubleshooting runbook",
    );
    expect(poisoned).toEqual([]);

    vi.unstubAllGlobals();
  });

  it("does not duplicate a doc link when fetched index repeats the same url under another category", async () => {
    const data = [
      {
        title: "Choose your next step",
        summary: "Map your current goal from the generated doc index.",
        category: "Go-to-Market",
        url: "/help/choose-your-next-step",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => data,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    await screen.findByRole("link", { name: "Choose your next step" });

    expect(screen.getAllByRole("link", { name: "Choose your next step" })).toHaveLength(1);

    vi.unstubAllGlobals();
  });

  it("does not duplicate a doc link when fetched index uses a different title for the same url", async () => {
    const data = [
      {
        title: "Platform health",
        summary: "System health and observability signals.",
        category: "Operations",
        url: "/help/admin-diagnostics",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => data,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    await screen.findByRole("link", { name: "Admin diagnostics" });

    expect(screen.queryByRole("link", { name: "Platform health" })).toBeNull();

    vi.unstubAllGlobals();
  });

  it("renders fetched entries whose category is not listed in CATEGORY_ORDER", async () => {
    const data = [
      {
        title: "Compliance guide",
        summary: "Regulatory compliance overview.",
        category: "Compliance",
        url: "/help/compliance",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => data,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Compliance guide" })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("loads index and filters by title or summary", async () => {
    const data = [
      {
        title: "Alpha Doc",
        summary: "First sentence about alpha. Second sentence.",
        category: "Getting Started",
        url: "https://example.com/a",
      },
      {
        title: "Beta API",
        summary: "Unrelated text without the query token.",
        category: "API",
        url: "https://example.com/b",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => data,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByText("Alpha Doc")).toBeInTheDocument();
    expect(screen.getByText("Beta API")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "alpha" } });

    expect(screen.getByText("Alpha Doc")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Beta API")).toBeNull();
    });

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nomatch-xyz-123" } });

    expect(screen.getByText("No results")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("filters entries by category name when title and summary omit the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Policy packs" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "security" } });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Policy packs" })).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("filters entries by documentation url path when title summary and category omit the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Indexed search" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "search-review-evidence" } });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Indexed search" })).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("uses valid html id tokens for category section headings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    const { container } = renderWithOperatorQuery(<HelpDocsClient />);

    await screen.findByRole("heading", { name: "Getting Started" });

    for (const heading of container.querySelectorAll("section[aria-labelledby] h2[id]")) {
      const id = heading.id;

      expect(id.length).toBeGreaterThan(0);
      expect(id).not.toMatch(/\s/);
      expect(document.getElementById(id)).toBe(heading);
    }

    vi.unstubAllGlobals();
  });

  it("shows fetched index matches for an active search after the index load completes", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.stubGlobal("fetch", vi.fn(async () => fetchPromise));

    renderWithOperatorQuery(<HelpDocsClient />);

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "unicorn compliance" } });

    expect(screen.getByText("No results")).toBeInTheDocument();

    resolveFetch?.({
      ok: true,
      json: async () => [
        {
          title: "Unicorn compliance topic",
          summary: "Fetched-only help row.",
          category: "Compliance",
          url: "/help/unicorn-compliance",
        },
      ],
    } as Response);

    expect(await screen.findByRole("link", { name: "Unicorn compliance topic" })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("opens protocol-relative documentation links in a new tab with noreferrer", async () => {
    const data = [
      {
        title: "Protocol relative doc",
        summary: "Hosted on another origin without an explicit scheme.",
        category: "API",
        url: "//example.com/docs/protocol-relative",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => data,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    const link = await screen.findByRole("link", { name: "Protocol relative doc" });

    expect(link).toHaveAttribute("href", "//example.com/docs/protocol-relative");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");

    vi.unstubAllGlobals();
  });

  it("opens external documentation links in a new tab with noreferrer", async () => {
    const data = [
      {
        title: "External alpha",
        summary: "Hosted outside the operator shell.",
        category: "API",
        url: "https://example.com/docs/alpha",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => data,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    const link = await screen.findByRole("link", { name: "External alpha" });

    expect(link).toHaveAttribute("href", "https://example.com/docs/alpha");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");

    vi.unstubAllGlobals();
  });

  it("keeps static quick links visible when the doc-index fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Policy packs" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Full documentation index could not be refreshed/i)).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("keeps static quick links visible while the doc-index refresh is pending", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.stubGlobal("fetch", vi.fn(async () => fetchPromise));

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(screen.getByText("Refreshing documentation index…")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Policy packs" })).toBeInTheDocument();

    resolveFetch?.({
      ok: true,
      json: async () => [],
    } as Response);

    await screen.findByRole("heading", { name: "Getting Started" });

    vi.unstubAllGlobals();
  });

  it("clears the search box when Escape is pressed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    const searchbox = await screen.findByRole("searchbox");

    fireEvent.change(searchbox, { target: { value: "security" } });
    expect(searchbox).toHaveValue("security");

    fireEvent.keyDown(searchbox, { key: "Escape" });

    expect(searchbox).toHaveValue("");
    expect(helpDocsNavigation.replace).toHaveBeenCalledWith("/help", { scroll: false });

    vi.unstubAllGlobals();
  });

  it("filters documentation on mount when q= is in the URL", async () => {
    helpDocsNavigation.params = new URLSearchParams("q=security");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Policy packs" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Reviews list" })).toBeNull();

    vi.unstubAllGlobals();
  });

  it("initializes the search box from the q URL parameter", async () => {
    helpDocsNavigation.params = new URLSearchParams("q=security");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("searchbox")).toHaveValue("security");

    vi.unstubAllGlobals();
  });

  it("debounces router replace when the search query changes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    const searchbox = await screen.findByRole("searchbox");

    vi.useFakeTimers();

    fireEvent.change(searchbox, { target: { value: "alpha" } });

    expect(helpDocsNavigation.replace).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(250);

    expect(helpDocsNavigation.replace).toHaveBeenCalledWith("/help?q=alpha", { scroll: false });

    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("filters documentation entries case-insensitively", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Policy packs" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "SECURITY" } });

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Policy packs" })).toBeInTheDocument();
    });

    vi.unstubAllGlobals();
  });

  it("treats whitespace-only search input as no active filter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Policy packs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reviews list" })).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "   " } });

    expect(screen.getByRole("link", { name: "Policy packs" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reviews list" })).toBeInTheDocument();
    expect(screen.queryByText("No results")).toBeNull();

    vi.unstubAllGlobals();
  });

  it("keeps internal documentation links in the same tab", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    const link = await screen.findByRole("link", { name: "Policy packs" });

    expect(link).toHaveAttribute("href", "/governance/policy-packs");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");

    vi.unstubAllGlobals();
  });

  it("dismisses the refreshing status after the doc-index fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Policy packs" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Refreshing documentation index…")).toBeNull();
    });

    vi.unstubAllGlobals();
  });

  it("renders unknown categories after the fixed CATEGORY_ORDER sections", async () => {
    const data = [
      {
        title: "Compliance guide",
        summary: "Regulatory compliance overview.",
        category: "Compliance",
        url: "/help/compliance",
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => data,
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    expect(await screen.findByRole("link", { name: "Compliance guide" })).toBeInTheDocument();

    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    const gettingStartedIndex = headings.indexOf("Getting Started");
    const complianceIndex = headings.indexOf("Compliance");

    expect(gettingStartedIndex).toBeGreaterThanOrEqual(0);
    expect(complianceIndex).toBeGreaterThan(gettingStartedIndex);

    vi.unstubAllGlobals();
  });

  it("does not clear the URL when Escape is pressed on an empty search box", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response),
      ),
    );

    renderWithOperatorQuery(<HelpDocsClient />);

    const searchbox = await screen.findByRole("searchbox");

    fireEvent.keyDown(searchbox, { key: "Escape" });

    expect(helpDocsNavigation.replace).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
