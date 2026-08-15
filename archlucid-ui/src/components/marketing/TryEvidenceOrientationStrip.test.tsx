import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TryEvidenceOrientationStrip } from "@/components/marketing/TryEvidenceOrientationStrip";
import { TRY_CANONICAL_PATH, TRY_SOURCES } from "@/lib/try-evidence-copy";

describe("TryEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking try", () => {
    render(<TryEvidenceOrientationStrip />);

    expect(screen.getByTestId("try-sources")).toBeInTheDocument();
    expect(screen.getByTestId("try-claim-discipline")).toBeInTheDocument();

    for (const link of TRY_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(TRY_SOURCES.some((link) => link.href === TRY_CANONICAL_PATH)).toBe(false);
  });
});
