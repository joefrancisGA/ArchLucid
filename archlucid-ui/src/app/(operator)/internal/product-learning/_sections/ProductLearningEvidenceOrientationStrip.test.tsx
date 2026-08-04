import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductLearningEvidenceOrientationStrip } from "@/app/(operator)/internal/product-learning/_sections/ProductLearningEvidenceOrientationStrip";
import {
  PRODUCT_LEARNING_CANONICAL_PATH,
  PRODUCT_LEARNING_SOURCES,
} from "@/lib/product-learning-evidence-copy";

describe("ProductLearningEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking product learning", () => {
    render(<ProductLearningEvidenceOrientationStrip />);

    expect(screen.getByTestId("product-learning-sources")).toBeInTheDocument();
    expect(screen.getByTestId("product-learning-claim-discipline")).toBeInTheDocument();

    for (const link of PRODUCT_LEARNING_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(PRODUCT_LEARNING_SOURCES.some((link) => link.href === PRODUCT_LEARNING_CANONICAL_PATH)).toBe(false);
  });
});
