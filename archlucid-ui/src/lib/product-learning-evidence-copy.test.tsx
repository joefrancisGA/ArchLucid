import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductLearningEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  PRODUCT_LEARNING_CANONICAL_PATH,
  PRODUCT_LEARNING_FOLLOW_UPS_TITLE,
  PRODUCT_LEARNING_SOURCES,
  PRODUCT_LEARNING_SOURCES_INTRO,
} from "@/lib/product-learning-evidence-copy";
import { readClaimAndSourcesRegistrySource } from "@/lib/testing/claim-and-sources-registry-source";

describe("product-learning-evidence-copy", () => {
  it("wires exports into the product learning evidence strip registry", () => {
    const registrySource = readClaimAndSourcesRegistrySource();

    expect(registrySource).toContain("product-learning-evidence-copy");
    expect(registrySource).toContain("ProductLearningEvidenceOrientationStrip");
    expect(PRODUCT_LEARNING_CANONICAL_PATH).toBe("/internal/product-learning");
  });

  it("renders operator Sources follow-ups without a claim-discipline callout", () => {
    render(<ProductLearningEvidenceOrientationStrip />);

    expect(screen.queryByTestId("product-learning-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByText(PRODUCT_LEARNING_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("product-learning-sources");

    for (const link of PRODUCT_LEARNING_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${PRODUCT_LEARNING_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels follow-ups for accessibility parity", () => {
    render(<ProductLearningEvidenceOrientationStrip />);
    expect(screen.getByRole("heading", { name: PRODUCT_LEARNING_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Sources package/i })).toBeNull();
  });
});
