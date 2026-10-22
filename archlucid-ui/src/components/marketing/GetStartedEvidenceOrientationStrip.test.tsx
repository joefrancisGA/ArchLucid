import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GetStartedEvidenceOrientationStrip } from "@/components/marketing/GetStartedEvidenceOrientationStrip";
import { GET_STARTED_CANONICAL_PATH, GET_STARTED_SOURCES } from "@/lib/get-started-evidence-copy";

describe("GetStartedEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking get-started or an amber claim callout", () => {
    render(<GetStartedEvidenceOrientationStrip />);

    expect(screen.getByTestId("get-started-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("get-started-claim-discipline")).toBeNull();

    for (const link of GET_STARTED_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(GET_STARTED_SOURCES.some((link) => link.href === GET_STARTED_CANONICAL_PATH)).toBe(false);
  });
});
