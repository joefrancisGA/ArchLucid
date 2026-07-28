import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ArchitectureIntelligencePageClient } from "./ArchitectureIntelligencePageClient";

const searchParamsGet = vi.fn<(key: string) => string | null>(() => null);

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    useSearchParams: () => ({
      get: searchParamsGet,
      getAll: vi.fn(() => []),
      has: vi.fn(() => false),
      toString: vi.fn(() => ""),
      entries: vi.fn(),
      forEach: vi.fn(),
      keys: vi.fn(),
      values: vi.fn(),
      [Symbol.iterator]: vi.fn(),
    }),
  };
});

describe("ArchitectureIntelligencePageClient", () => {
  beforeEach(() => {
    searchParamsGet.mockImplementation(() => null);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({}),
        text: async () => "",
      })),
    );
  });

  it("renders description input and action buttons", () => {
    render(<ArchitectureIntelligencePageClient />);

    expect(screen.getByTestId("architecture-intelligence-page")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-description")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-priorities")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run architecture reasoning" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run golden test" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load golden fixture" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish to findings/advisory" })).toBeInTheDocument();
    expect(screen.getByTestId("architecture-intelligence-publish-toggle")).toBeInTheDocument();
  });

  it("hydrates architecture description from product run source-context", async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === "runId") {
        return "dddddddd-dddd-dddd-dddd-dddddddddddd";
      }

      if (key === "from") {
        return "reviews";
      }

      return null;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);

        if (url.includes("/product-runs/") && url.includes("/source-context")) {
          return {
            ok: true,
            json: async () => ({
              runId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              sourceTexts: [
                {
                  fileName: "architecture-description.txt",
                  contentType: "text/plain",
                  content: "Hydrated product architecture description.",
                },
              ],
            }),
            text: async () => "",
          };
        }

        return {
          ok: true,
          json: async () => ({}),
          text: async () => "",
        };
      }),
    );

    render(<ArchitectureIntelligencePageClient />);

    await waitFor(() => {
      expect(screen.getByTestId("architecture-intelligence-description")).toHaveValue(
        "Hydrated product architecture description.",
      );
    });

    expect(screen.getByTestId("architecture-intelligence-inbound-context")).toHaveTextContent(
      "Loaded product intake from review",
    );
  });
});
