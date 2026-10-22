import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RetryableSection } from "@/components/RetryableSection";

describe("RetryableSection", () => {
  it("loads data and renders children", async () => {
    const fetchData = vi.fn().mockResolvedValue("ok");

    render(
      <RetryableSection title="Test" fetchData={fetchData}>
        {(data, loading) => (
          <p>{loading ? "loading" : `data:${data}`}</p>
        )}
      </RetryableSection>,
    );

    await waitFor(() => {
      expect(screen.getByText("data:ok")).toBeInTheDocument();
    });
  });

  it("shows error and retry replaces children until success", async () => {
    let calls = 0;
    const fetchData = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1) {
        throw new Error("fail");
      }

      return "fixed";
    });

    render(
      <RetryableSection title="T" fetchData={fetchData}>
        {(data) => <span>{data}</span>}
      </RetryableSection>,
    );

    await waitFor(() => {
      expect(screen.getByText("fail")).toBeInTheDocument();
    });

    await screen.getByRole("button", { name: /retry/i }).click();

    await waitFor(() => {
      expect(screen.getByText("fixed")).toBeInTheDocument();
    });
  });
});
