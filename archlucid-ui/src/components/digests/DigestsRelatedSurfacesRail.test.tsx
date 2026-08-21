import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsRelatedSurfacesRail } from "@/components/digests/DigestsRelatedSurfacesRail";
import {
  buildDigestsRelatedSurfaceLinks,
  DIGESTS_RELATED_SURFACES_COMPACT_LINE,
  DIGESTS_RELATED_SURFACES_HEADING,
  DIGESTS_RELATED_SURFACES_WHY,
  type DigestsRelatedSurfaceLink,
} from "@/lib/vocabulary/digests-related-surfaces-vocabulary";

describe("DigestsRelatedSurfacesRail", () => {
  it("renders one compact line with every peer surface link", () => {
    render(<DigestsRelatedSurfacesRail />);

    const strip = screen.getByTestId("digests-related-surfaces");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "digests");
    expect(strip.textContent ?? "").toContain(DIGESTS_RELATED_SURFACES_COMPACT_LINE);

    const links: readonly DigestsRelatedSurfaceLink[] = buildDigestsRelatedSurfaceLinks();

    links.forEach((link) => {
      const peer = screen.getByTestId(`digests-related-surfaces-peer-${link.id}`);
      expect(peer).toHaveTextContent(link.label);
      expect(peer).toHaveAttribute("href", link.href);
    });
  });

  /**
   * The line replaced four rails that each re-defined "digest" to contrast it with one
   * neighbour. Keeping the compact copy short is the point of the component, so guard it.
   */
  it("states no definition of digests in the compact line", () => {
    render(<DigestsRelatedSurfacesRail />);

    expect(DIGESTS_RELATED_SURFACES_COMPACT_LINE).not.toContain("cadence");
    expect(screen.getByTestId("digests-related-surfaces").textContent ?? "").not.toContain(
      "cadence",
    );
  });

  it("renders the full variant with a single digests definition", () => {
    render(<DigestsRelatedSurfacesRail variant="full" />);

    expect(screen.getByText(DIGESTS_RELATED_SURFACES_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DIGESTS_RELATED_SURFACES_WHY)).toBeInTheDocument();
    expect(screen.queryByTestId("digests-related-surfaces-current")).not.toBeInTheDocument();
  });

  it("accepts a caller-supplied link set", () => {
    render(
      <DigestsRelatedSurfacesRail
        links={[{ id: "slack", label: "Slack", href: "/integrations/slack" }]}
      />,
    );

    expect(screen.getByTestId("digests-related-surfaces-peer-slack")).toHaveAttribute(
      "href",
      "/integrations/slack",
    );
    expect(
      screen.queryByTestId("digests-related-surfaces-peer-notifications"),
    ).not.toBeInTheDocument();
  });
});
