import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsSourcesStrip } from "@/components/digests/DigestsSourcesStrip";
import { DIGESTS_CANONICAL_PATH, DIGESTS_SOURCES } from "@/lib/digests-evidence-copy";

describe("DigestsSourcesStrip", () => {
  it("lists follow-up Sources without self-linking digests", () => {
    render(<DigestsSourcesStrip />);

    expect(screen.getByTestId("digests-sources")).toBeInTheDocument();
    expect(screen.getByTestId("digests-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(/summarize workspace activity/i)).toBeInTheDocument();

    const sources = screen.getByTestId("digests-sources");

    for (const link of DIGESTS_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(DIGESTS_SOURCES.some((link) => link.href === DIGESTS_CANONICAL_PATH)).toBe(false);
  });
});
