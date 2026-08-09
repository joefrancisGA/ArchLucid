import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HelpCloudConnectionsGuideView } from "@/app/(operator)/help/_sections/HelpCloudConnectionsGuideView";
import {
  CLOUD_CONNECTIONS_HELP_PATH,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
} from "@/lib/cloud-connections-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpCloudConnectionsGuideView (HCE)", () => {
  it("renders claim discipline and primary CTAs without a Sources strip", () => {
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
    expect(screen.queryByTestId("help-cloud-connections-sources")).toBeNull(); // TB-2092
    expect(screen.getByTestId("help-cloud-connections-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.label })).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href,
    );
    expect(screen.getByRole("link", { name: CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.connectAzure.label })).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.connectAzure.href,
    );
    expect(CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.openHub.href).not.toBe(CLOUD_CONNECTIONS_HELP_PATH);
  });
});
