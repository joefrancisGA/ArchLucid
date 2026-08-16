import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExampleRoiBulletinEvidenceOrientationStrip } from "@/components/marketing/ExampleRoiBulletinEvidenceOrientationStrip";
import {
  EXAMPLE_ROI_BULLETIN_CANONICAL_PATH,
  EXAMPLE_ROI_BULLETIN_SOURCES,
} from "@/lib/example-roi-bulletin-evidence-copy";

describe("ExampleRoiBulletinEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking example ROI bulletin or amber claim callout", () => {
    render(<ExampleRoiBulletinEvidenceOrientationStrip />);

    expect(screen.getByTestId("example-roi-bulletin-sources")).toBeInTheDocument();
    expect(screen.queryByTestId("example-roi-bulletin-claim-discipline")).toBeNull();

    for (const link of EXAMPLE_ROI_BULLETIN_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      EXAMPLE_ROI_BULLETIN_SOURCES.some((link) => link.href === EXAMPLE_ROI_BULLETIN_CANONICAL_PATH),
    ).toBe(false);
  });
});
