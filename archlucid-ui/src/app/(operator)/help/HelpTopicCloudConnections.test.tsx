import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpCloudConnectionsGuideView } from "@/app/(operator)/help/_sections/HelpCloudConnectionsGuideView";
import {
  CLOUD_CONNECTIONS_HELP_PATH,
  CLOUD_CONNECTIONS_HELP_SOURCES,
} from "@/lib/cloud-connections-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpCloudConnectionsGuideView (HCE)", () => {
  it("renders Sources strip, claim discipline, and primary CTAs without self-linking", () => {
    const entry = getProductDocumentationEntry("cloud-connections");

    expect(entry?.slug).toBe("cloud-connections");

    if (entry === null) {
      throw new Error("Expected cloud-connections documentation entry.");
    }

    render(
      <HelpCloudConnectionsGuideView
        entry={entry}
        markdown="# Cloud connections\n\nOptional connectors for read-only evidence.\n"
      />,
    );

    expect(screen.getByTestId("help-cloud-connections-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open cloud connections" })).toHaveAttribute(
      "href",
      "/integrations/cloud-connections",
    );

    const sources = screen.getByTestId("help-cloud-connections-sources");

    for (const link of CLOUD_CONNECTIONS_HELP_SOURCES) {
      const matches = screen.getAllByRole("link", { name: link.label });

      expect(matches.some((anchor) => anchor.getAttribute("href") === link.href)).toBe(true);
      expect(sources.querySelector(`a[href="${link.href}"]`)).not.toBeNull();
    }

    expect(CLOUD_CONNECTIONS_HELP_SOURCES.some((link) => link.href === CLOUD_CONNECTIONS_HELP_PATH)).toBe(
      false,
    );
  });
});
