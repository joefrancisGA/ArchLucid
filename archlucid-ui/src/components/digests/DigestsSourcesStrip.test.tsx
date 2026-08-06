import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsSourcesStrip } from "@/components/digests/DigestsSourcesStrip";
import { DIGESTS_CANONICAL_PATH, DIGESTS_SOURCES } from "@/lib/digests-evidence-copy";

describe("DigestsSourcesStrip", () => {
  it("lists follow-up Sources without self-linking digests", () => {
    render(<DigestsSourcesStrip />);

    expect(screen.getByTestId("digests-sources")).toBeInTheDocument();

    // Owner decision 2026-08-05: no claim-boundary band on the digests hub.
    expect(screen.queryByTestId("digests-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByText(/Do not imply CPA SOC 2/i)).not.toBeInTheDocument();

    const sources = screen.getByTestId("digests-sources");

    for (const link of DIGESTS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(DIGESTS_SOURCES.some((link) => link.href === DIGESTS_CANONICAL_PATH)).toBe(false);
  });
});
