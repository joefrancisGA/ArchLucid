import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WhyEvidenceOrientationStrip } from "@/components/marketing/WhyEvidenceOrientationStrip";
import { WHY_CANONICAL_PATH, WHY_SOURCES } from "@/lib/why-evidence-copy";

describe("WhyEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking why", () => {
    render(<WhyEvidenceOrientationStrip />);

    expect(screen.getByTestId("why-sources")).toBeInTheDocument();
    expect(screen.getByTestId("why-claim-discipline")).toBeInTheDocument();

    for (const link of WHY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(WHY_SOURCES.some((link) => link.href === WHY_CANONICAL_PATH)).toBe(false);
  });
});
