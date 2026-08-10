import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE,
  REVIEW_CREATED_SUCCESS_MESSAGE,
  ReviewGenerationCreatedNotice,
} from "@/components/review-intake/ReviewGenerationCreatedNotice";
import { FROM_GENERATION_QUERY_KEY } from "@/lib/review-generation-handoff";
import { REVIEW_PIPELINE_BACKGROUND_SAFETY_MESSAGE } from "@/lib/review-execution-background-safety-copy";

const searchParamsGet = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => searchParamsGet(key),
  }),
}));

describe("ReviewGenerationCreatedNotice", () => {
  it("renders durable in-page confirmation when redirected from review creation", () => {
    searchParamsGet.mockImplementation((key: string) => (key === FROM_GENERATION_QUERY_KEY ? "1" : null));

    render(<ReviewGenerationCreatedNotice />);

    expect(screen.getByTestId("review-generation-created-notice")).toHaveTextContent(
      REVIEW_CREATED_SUCCESS_MESSAGE,
    );
    expect(screen.queryByText("Ready")).not.toBeInTheDocument();
  });

  it("stays hidden without the fromGeneration query flag", () => {
    searchParamsGet.mockReturnValue(null);

    render(<ReviewGenerationCreatedNotice />);

    expect(screen.queryByTestId("review-generation-created-notice")).not.toBeInTheDocument();
  });

  it("suppresses the receipt when approval is blocked or the package is finalized", () => {
    searchParamsGet.mockImplementation((key: string) => (key === FROM_GENERATION_QUERY_KEY ? "1" : null));

    const { rerender } = render(<ReviewGenerationCreatedNotice approvalBlocked packageFinalized={false} />);

    expect(screen.queryByTestId("review-generation-created-notice")).not.toBeInTheDocument();

    rerender(<ReviewGenerationCreatedNotice approvalBlocked={false} packageFinalized />);

    expect(screen.queryByTestId("review-generation-created-notice")).not.toBeInTheDocument();
  });

  it("shows background-safety copy while analysis is still in progress", () => {
    searchParamsGet.mockImplementation((key: string) => (key === FROM_GENERATION_QUERY_KEY ? "1" : null));

    render(<ReviewGenerationCreatedNotice analysisInProgress />);

    expect(screen.getByTestId("review-generation-created-notice")).toHaveTextContent(
      REVIEW_CREATED_ANALYSIS_IN_PROGRESS_MESSAGE,
    );
    expect(screen.getByTestId("review-generation-background-safety")).toHaveTextContent(
      REVIEW_PIPELINE_BACKGROUND_SAFETY_MESSAGE,
    );
  });
});
