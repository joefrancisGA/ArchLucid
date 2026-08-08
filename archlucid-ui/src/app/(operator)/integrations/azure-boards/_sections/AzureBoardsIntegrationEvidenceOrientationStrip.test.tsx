import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AzureBoardsIntegrationEvidenceOrientationStrip } from "@/app/(operator)/integrations/azure-boards/_sections/AzureBoardsIntegrationEvidenceOrientationStrip";
import {
  AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
  AZURE_BOARDS_INTEGRATION_SOURCES,
} from "@/lib/azure-boards-integration-evidence-copy";

describe("AzureBoardsIntegrationEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking azure-boards settings", () => {
    render(<AzureBoardsIntegrationEvidenceOrientationStrip />);

    expect(screen.getByTestId("azure-boards-integration-sources")).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-integration-claim-discipline")).toHaveTextContent(
      /Outbound config|diligence Sources|CPA SOC 2/i,
    );

    const sources = screen.getByTestId("azure-boards-integration-sources");

    for (const link of AZURE_BOARDS_INTEGRATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      AZURE_BOARDS_INTEGRATION_SOURCES.some((link) => link.href === AZURE_BOARDS_INTEGRATION_CANONICAL_PATH),
    ).toBe(false);
  });
});
