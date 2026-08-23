import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { StructuredBriefSuggestionExplainPanel } from "@/components/architecture/StructuredBriefSuggestionExplainPanel";
import { explainStructuredBriefSuggestion } from "@/lib/api/structured-brief-suggestion-explain-api";
import { ApiRequestError } from "@/lib/api-request-error";
import { clearStructuredBriefSuggestionExplainCache } from "@/lib/architecture/structured-brief-suggestion-explain-cache";
import { GUIDED_INTAKE_EXPLAIN_SUGGESTION_LOADING } from "@/lib/guided-intake-copy";

vi.mock("@/lib/api/structured-brief-suggestion-explain-api", () => ({
  explainStructuredBriefSuggestion: vi.fn(),
  buildStructuredBriefSuggestionExplainCacheKey: vi.fn(async () => "cache-key-1"),
}));

const mockedExplain = vi.mocked(explainStructuredBriefSuggestion);

const sourceText =
  "Architecture overview:\nTenant migration platform with private networking and EU residency goals.";

describe("StructuredBriefSuggestionExplainPanel", () => {
  beforeEach(() => {
    clearStructuredBriefSuggestionExplainCache();
    mockedExplain.mockReset();
  });

  it("shows loading state while explanation is fetched", async () => {
    let resolveExplain: ((value: { explanation: string }) => void) | undefined;
    const pending = new Promise<{ explanation: string }>((resolve) => {
      resolveExplain = resolve;
    });
    mockedExplain.mockReturnValue(pending);

    render(
      <StructuredBriefSuggestionExplainPanel
        suggestionKind="Constraint"
        suggestionText="EU data residency"
        sourceText={sourceText}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Explain/i }));

    expect(await screen.findByText(GUIDED_INTAKE_EXPLAIN_SUGGESTION_LOADING)).toBeInTheDocument();

    resolveExplain?.({ explanation: "Loaded after delay." });

    expect(await screen.findByText("Loaded after delay.")).toBeInTheDocument();
  });

  it("opens disclosure and fetches explanation on first click", async () => {
    mockedExplain.mockResolvedValue({
      explanation:
        "Your overview mentioned EU customers. Confirming this tells the review to store data in EU regions only.",
    });

    render(
      <StructuredBriefSuggestionExplainPanel
        suggestionKind="Constraint"
        suggestionText="EU data residency"
        sourceText={sourceText}
        testId="constraint-explain"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Explain/i }));

    expect(
      await screen.findByText(/Confirming this tells the review to store data in EU regions only/i),
    ).toBeInTheDocument();

    expect(mockedExplain).toHaveBeenCalledWith({
      sourceText,
      suggestionKind: "Constraint",
      suggestionText: "EU data residency",
    });
  });

  it("shows inline error and allows retry without blocking the row", async () => {
    mockedExplain
      .mockRejectedValueOnce(
        new ApiRequestError("Monthly AI budget exhausted.", {
          problem: null,
          correlationId: null,
          httpStatus: 429,
        }),
      )
      .mockResolvedValueOnce({
        explanation: "Retry succeeded with EU residency context.",
      });

    render(
      <StructuredBriefSuggestionExplainPanel
        suggestionKind="Constraint"
        suggestionText="EU data residency"
        sourceText={sourceText}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Explain/i }));

    expect(await screen.findByText("Monthly AI budget exhausted.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("structured-brief-suggestion-explain-retry"));

    expect(await screen.findByText("Retry succeeded with EU residency context.")).toBeInTheDocument();
    expect(mockedExplain).toHaveBeenCalledTimes(2);
  });

  it("uses cache on second open without a second fetch", async () => {
    mockedExplain.mockResolvedValue({
      explanation: "Cached EU residency explanation.",
    });

    render(
      <StructuredBriefSuggestionExplainPanel
        suggestionKind="Constraint"
        suggestionText="EU data residency"
        sourceText={sourceText}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Explain/i }));
    expect(await screen.findByText("Cached EU residency explanation.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Explain/i }));
    fireEvent.click(screen.getByRole("button", { name: /Explain/i }));

    await waitFor(() => {
      expect(mockedExplain).toHaveBeenCalledTimes(1);
    });
  });
});
