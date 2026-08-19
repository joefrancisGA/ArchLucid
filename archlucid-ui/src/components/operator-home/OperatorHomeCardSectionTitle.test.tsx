import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorHomeCardSectionTitle } from "@/components/operator-home/OperatorHomeCardSectionTitle";
import { OPERATOR_HOME_CARD_SECTION_HEADING } from "@/lib/design-tokens";

describe("OperatorHomeCardSectionTitle", () => {
  it("renders peer overview card heading typography", () => {
    render(<OperatorHomeCardSectionTitle id="card-title-test">How ArchLucid works</OperatorHomeCardSectionTitle>);

    const heading = screen.getByRole("heading", { level: 2, name: "How ArchLucid works" });

    expect(heading).toHaveAttribute("id", "card-title-test");
    expect(heading.className).toContain("font-semibold");
    expect(heading.className).toContain("text-[15px]");
    expect(heading.className).toContain("tracking-tight");
    expect(OPERATOR_HOME_CARD_SECTION_HEADING).toContain("tracking-tight");
  });
});
