import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CloudProviderConnectionEvidenceOrientationStrip } from "@/app/(operator)/integrations/cloud-connections/_sections/CloudProviderConnectionEvidenceOrientationStrip";
import {
  CLOUD_PROVIDER_CONNECTION_PATHS,
  cloudProviderConnectionSources,
} from "@/lib/cloud-provider-connection-evidence-copy";

describe("CloudProviderConnectionEvidenceOrientationStrip", () => {
  it("lists AWS follow-up Sources without self-linking the AWS detail path", () => {
    render(<CloudProviderConnectionEvidenceOrientationStrip provider="aws" />);

    expect(screen.getByTestId("cloud-connection-aws-sources")).toBeInTheDocument();
    expect(screen.getByTestId("cloud-connection-aws-claim-discipline")).toHaveTextContent(
      /Read-only|diligence Sources|CPA SOC 2/i,
    );

    const sources = screen.getByTestId("cloud-connection-aws-sources");
    const links = cloudProviderConnectionSources("aws");

    for (const link of links) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(links.some((link) => link.href === CLOUD_PROVIDER_CONNECTION_PATHS.aws)).toBe(false);
  });

  it("lists Azure follow-up Sources without self-linking the Azure detail path", () => {
    render(<CloudProviderConnectionEvidenceOrientationStrip provider="azure" />);

    const sources = screen.getByTestId("cloud-connection-azure-sources");
    const links = cloudProviderConnectionSources("azure");

    for (const link of links) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(links.some((link) => link.href === CLOUD_PROVIDER_CONNECTION_PATHS.azure)).toBe(false);
  });
});
