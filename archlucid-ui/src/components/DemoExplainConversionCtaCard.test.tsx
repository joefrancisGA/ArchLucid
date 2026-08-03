import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  DEMO_EXPLAIN_CONVERSION_REVIEW_HREF,
  DemoExplainConversionCtaCard,
} from "@/components/DemoExplainConversionCtaCard";

describe("DemoExplainConversionCtaCard", () => {
  it("renders CTA with primary button href preset=greenfield", () => {
    render(<DemoExplainConversionCtaCard />);

    expect(screen.getByTestId("demo-explain-conversion-cta")).toBeInTheDocument();
    expect(screen.getByTestId("demo-explain-conversion-primary")).toHaveAttribute(
      "href",
      DEMO_EXPLAIN_CONVERSION_REVIEW_HREF,
    );
    expect(DEMO_EXPLAIN_CONVERSION_REVIEW_HREF).toBe("/architecture/reviews/new?preset=greenfield");
    expect(screen.getByTestId("demo-explain-conversion-fab")).toHaveAttribute(
      "href",
      DEMO_EXPLAIN_CONVERSION_REVIEW_HREF,
    );
    expect(screen.getByRole("link", { name: "See what you need first" })).toHaveAttribute(
      "href",
      "/help/path-chooser",
    );
  });
});
