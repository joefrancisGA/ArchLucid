import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HelpDocsClient } from "./HelpDocsClient";

describe("HelpDocsClient", () => {
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

    render(<HelpDocsClient />);

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
