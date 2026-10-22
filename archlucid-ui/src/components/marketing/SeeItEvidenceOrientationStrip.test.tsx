import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeeItEvidenceOrientationStrip } from "@/components/marketing/SeeItEvidenceOrientationStrip";
import { SEE_IT_CANONICAL_PATH, SEE_IT_SOURCES } from "@/lib/see-it-evidence-copy";

describe("SeeItEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking see-it or amber claim callout", () => {
    render(<SeeItEvidenceOrientationStrip />);

    expect(screen.getByTestId("see-it-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("see-it-claim-discipline")).toBeNull();

    for (const link of SEE_IT_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SEE_IT_SOURCES.some((link) => link.href === SEE_IT_CANONICAL_PATH)).toBe(false);
    expect(SEE_IT_SOURCES.some((link) => link.href === "/demo/preview")).toBe(false);
  });
});
