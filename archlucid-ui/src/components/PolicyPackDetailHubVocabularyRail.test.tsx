import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PolicyPackDetailHubVocabularyRail } from "@/components/PolicyPackDetailHubVocabularyRail";
import {
  POLICY_PACK_DETAIL_HUB_COMPACT_LINE,
  POLICY_PACK_DETAIL_HUB_HEADING,
  POLICY_PACK_DETAIL_HUB_PACKS_LINK,
  POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK,
  POLICY_PACK_DETAIL_HUB_WHY_TWO,
} from "@/lib/policy-pack-detail-hub-vocabulary";

describe("PolicyPackDetailHubVocabularyRail (TB-2283)", () => {
  it("renders packs hub strip with peer link to pack detail", () => {
    render(<PolicyPackDetailHubVocabularyRail currentSurfaceId="policy-packs" />);

    const strip = screen.getByTestId("policy-pack-detail-hub-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "policy-packs");
    expect(strip.textContent ?? "").toContain(POLICY_PACK_DETAIL_HUB_COMPACT_LINE);

    const peer = screen.getByTestId("policy-pack-detail-hub-vocabulary-peer-link");
    expect(peer).toHaveTextContent(POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK.label);
    expect(peer).toHaveAttribute("href", POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK.href);
  });

  it("renders pack detail strip with peer link to policy packs", () => {
    render(<PolicyPackDetailHubVocabularyRail currentSurfaceId="pack-detail" />);

    expect(screen.getByTestId("policy-pack-detail-hub-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "pack-detail",
    );

    const peer = screen.getByTestId("policy-pack-detail-hub-vocabulary-peer-link");
    expect(peer).toHaveTextContent(POLICY_PACK_DETAIL_HUB_PACKS_LINK.label);
    expect(peer).toHaveAttribute("href", POLICY_PACK_DETAIL_HUB_PACKS_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <PolicyPackDetailHubVocabularyRail currentSurfaceId="policy-packs" variant="full" />,
    );

    const strip = screen.getByTestId("policy-pack-detail-hub-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(POLICY_PACK_DETAIL_HUB_HEADING)).toBeInTheDocument();
    expect(screen.getByText(POLICY_PACK_DETAIL_HUB_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("policy-pack-detail-hub-vocabulary-current")).toHaveTextContent(
      POLICY_PACK_DETAIL_HUB_PACKS_LINK.label,
    );
  });
});
