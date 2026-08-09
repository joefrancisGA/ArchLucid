import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  REVIEW_CREATED_SUCCESS_MESSAGE,
  ReviewGenerationCreatedNotice,
} from "@/components/review-intake/ReviewGenerationCreatedNotice";
import { FROM_GENERATION_QUERY_KEY } from "@/lib/review-generation-handoff";

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
  });

  it("stays hidden without the fromGeneration query flag", () => {
    searchParamsGet.mockReturnValue(null);

    render(<ReviewGenerationCreatedNotice />);

    expect(screen.queryByTestId("review-generation-created-notice")).not.toBeInTheDocument();
  });
});
