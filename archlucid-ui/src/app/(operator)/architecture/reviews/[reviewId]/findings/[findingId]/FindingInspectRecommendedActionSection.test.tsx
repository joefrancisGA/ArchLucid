import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { FindingInspectRecommendedActionSection } from "./FindingInspectRecommendedActionSection";

it("labels the stored remediation deadline in the recommended action section", () => {
  render(
    <FindingInspectRecommendedActionSection
      tone="detail"
      structuredActions={[]}
      recommendedActionParagraph="Update the architecture package."
      showOwnerCadence
      nextReviewLabel="Nov 30, 2026"
    />,
  );

  const label = screen.getByText("Remediation due", { selector: "dt" });
  expect(label.nextElementSibling).toHaveTextContent("Nov 30, 2026");
});
