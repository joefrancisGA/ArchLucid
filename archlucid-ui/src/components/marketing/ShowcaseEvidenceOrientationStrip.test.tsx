import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ShowcaseEvidenceOrientationStrip } from "@/components/marketing/ShowcaseEvidenceOrientationStrip";
import {
  SHOWCASE_CANONICAL_PATH_PREFIX,
  SHOWCASE_SOURCES,
} from "@/lib/showcase-evidence-copy";

describe("ShowcaseEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking showcase routes", () => {
    render(<ShowcaseEvidenceOrientationStrip />);

    expect(screen.getByTestId("showcase-sources")).toBeInTheDocument();
    expectClaimDisciplineBand(screen, "showcase-claim-discipline".slice(0, -"-claim-discipline".length), "showcase-claim-discipline");

    for (const link of SHOWCASE_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(SHOWCASE_SOURCES.some((link) => link.href.startsWith(SHOWCASE_CANONICAL_PATH_PREFIX))).toBe(false);
  });
});
