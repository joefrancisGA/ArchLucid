import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPackDetailSourcesStrip } from "@/app/(operator)/governance/policy-packs/[id]/PolicyPackDetailSourcesStrip";
import {
  POLICY_PACK_DETAIL_PATH_PREFIX,
  POLICY_PACK_DETAIL_SOURCES,
} from "@/lib/policy-pack-detail-evidence-copy";

describe("PolicyPackDetailSourcesStrip", () => {
  it("lists follow-up Sources without self-linking pack detail", () => {
    render(<PolicyPackDetailSourcesStrip />);

    expect(screen.getByTestId("policy-pack-detail-sources")).toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-detail-claim-discipline")).toHaveTextContent(
      /published rules|diligence Sources/i,
    );

    const sources = screen.getByTestId("policy-pack-detail-sources");

    for (const link of POLICY_PACK_DETAIL_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      POLICY_PACK_DETAIL_SOURCES.some((link) => link.href.startsWith(POLICY_PACK_DETAIL_PATH_PREFIX)),
    ).toBe(false);
  });
});
