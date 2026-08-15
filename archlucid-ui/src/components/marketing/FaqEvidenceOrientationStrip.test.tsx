import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FaqEvidenceOrientationStrip } from "@/components/marketing/FaqEvidenceOrientationStrip";
import { FAQ_CANONICAL_PATH, FAQ_SOURCES } from "@/lib/faq-evidence-copy";

describe("FaqEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking /faq", () => {
    render(<FaqEvidenceOrientationStrip part="sources" />);

    expect(screen.getByTestId("faq-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("faq-claim-discipline")).not.toBeInTheDocument();

    for (const link of FAQ_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(FAQ_SOURCES.some((link) => link.href === FAQ_CANONICAL_PATH)).toBe(false);
  });

  it("renders the claim band when part is claim", () => {
    render(<FaqEvidenceOrientationStrip part="claim" />);

    expect(screen.getByTestId("faq-claim-discipline")).toBeInTheDocument();
    expect(screen.queryByTestId("faq-sources")).not.toBeInTheDocument();
  });
});
