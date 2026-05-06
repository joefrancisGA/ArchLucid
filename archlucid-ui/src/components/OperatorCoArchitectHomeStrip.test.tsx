import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { OperatorCoArchitectHomeStrip } from "./OperatorCoArchitectHomeStrip";

import {
  OPERATOR_CO_ARCHITECT_BRAND_LINE,
  OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY,
  OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY,
} from "@/lib/operator-co-architect-copy";

afterEach(() => {
  localStorage.clear();
});

describe("OperatorCoArchitectHomeStrip", () => {
  it("renders umbrella line and review-first plus describe CTAs", async () => {
    render(<OperatorCoArchitectHomeStrip />);

    expect(await screen.findByText(OPERATOR_CO_ARCHITECT_BRAND_LINE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY })).toHaveAttribute("href", "/reviews/new");
    expect(screen.getByRole("link", { name: OPERATOR_CO_ARCHITECT_CTA_DESCRIBE_SECONDARY })).toHaveAttribute(
      "href",
      "/reviews/new?intent=describe",
    );
  });
});
