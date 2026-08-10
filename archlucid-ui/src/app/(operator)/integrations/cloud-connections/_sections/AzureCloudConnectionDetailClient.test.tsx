import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./Tier2ConnectionWizard", () => ({
  Tier2ConnectionWizard: () => <div data-testid="tier2-connection-wizard-stub" />,
}));

vi.mock("./CloudSecurityPreflightPanel", () => ({
  CloudSecurityPreflightPanel: () => <div data-testid="azure-preflight-stub" />,
  CloudSecurityPreflightTechnicalDetails: ({ children }: { children: ReactNode }) => (
    <div data-testid="azure-technical-details-stub">{children}</div>
  ),
}));

import { AzureCloudConnectionDetailClient } from "./AzureCloudConnectionDetailClient";
import { AZURE_CLOUD_CONNECTION_BANNED_COPY } from "@/lib/azure-cloud-connection-copy";

describe("AzureCloudConnectionDetailClient", () => {
  it("does not surface Tier/hosted-pull jargon on the Azure product surface (TB-1766)", () => {
    render(<AzureCloudConnectionDetailClient />);

    const detail = screen.getByTestId("cloud-connection-detail-azure");
    const text = detail.textContent ?? "";

    for (const banned of AZURE_CLOUD_CONNECTION_BANNED_COPY) {
      expect(text.toLowerCase()).not.toContain(banned.toLowerCase());
    }
  });
});
