import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OperatorCoArchitectHomeStrip } from "./OperatorCoArchitectHomeStrip";

import {
  OPERATOR_CO_ARCHITECT_BRAND_LINE,
  OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY,
  OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY,
  OPERATOR_CO_ARCHITECT_INTENT_STORAGE_KEY,
} from "@/lib/operator-co-architect-copy";

afterEach(() => {
  localStorage.clear();
});

describe("OperatorCoArchitectHomeStrip", () => {
  it("renders umbrella line and review-first plus describe CTAs", () => {
    render(<OperatorCoArchitectHomeStrip />);

    expect(screen.getByText(OPERATOR_CO_ARCHITECT_BRAND_LINE)).toBeInTheDocument();
    expect(screen.queryByText(/Last selected entry/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY })).toHaveAttribute(
      "href",
      "/reviews/new?intent=describe",
    );
  });

  it("persists last-clicked intent in localStorage without surfacing preference copy", () => {
    render(<OperatorCoArchitectHomeStrip />);

    fireEvent.click(screen.getByRole("link", { name: OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY }));

    expect(localStorage.getItem(OPERATOR_CO_ARCHITECT_INTENT_STORAGE_KEY)).toBe("review");
    expect(screen.queryByText(/preference is saved/i)).not.toBeInTheDocument();
  });
});
