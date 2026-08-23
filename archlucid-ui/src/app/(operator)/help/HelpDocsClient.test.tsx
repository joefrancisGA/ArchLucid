import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithOperatorQuery, useOperatorQueryTestLifecycle } from "@/testing/operator-query-test-helpers";

import { HelpDocsClient } from "./HelpDocsClient";

describe("HelpDocsClient", () => {
  useOperatorQueryTestLifecycle();

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
});
