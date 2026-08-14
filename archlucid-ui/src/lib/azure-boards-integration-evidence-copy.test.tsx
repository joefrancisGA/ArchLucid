import { readFileSync } from "node:fs";
import path from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AzureBoardsIntegrationEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import {
  AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
  AZURE_BOARDS_INTEGRATION_CLAIM_DISCIPLINE,
  AZURE_BOARDS_INTEGRATION_CLAIM_DISCIPLINE_HEADING,
  AZURE_BOARDS_INTEGRATION_CLAIM_HEADING_ID,
  AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE,
  AZURE_BOARDS_INTEGRATION_SOURCES,
  AZURE_BOARDS_INTEGRATION_SOURCES_INTRO,
} from "@/lib/azure-boards-integration-evidence-copy";

describe("azure-boards-integration-evidence-copy", () => {
  it("wires exports into the Azure Boards integration evidence strip registry", () => {
    const registryPath = path.join(
      process.cwd(),
      "src/components/evidence-orientation/registry/claim-and-sources-strips.tsx",
    );
    const registrySource = readFileSync(registryPath, "utf8");

    expect(registrySource).toContain("azure-boards-integration-evidence-copy");
    expect(registrySource).toContain("AzureBoardsIntegrationEvidenceOrientationStrip");
    expect(AZURE_BOARDS_INTEGRATION_CANONICAL_PATH).toBe("/integrations/azure-boards");
  });

  it("renders claim discipline and operator Sources follow-ups", () => {
    render(<AzureBoardsIntegrationEvidenceOrientationStrip />);

    expect(screen.getByTestId("azure-boards-integration-claim-discipline")).toHaveTextContent(
      AZURE_BOARDS_INTEGRATION_CLAIM_DISCIPLINE,
    );
    expect(screen.getByText(AZURE_BOARDS_INTEGRATION_SOURCES_INTRO)).toBeInTheDocument();

    const sources = screen.getByTestId("azure-boards-integration-sources");

    for (const link of AZURE_BOARDS_INTEGRATION_SOURCES) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      within(sources).queryByRole("link", { name: new RegExp(`^${AZURE_BOARDS_INTEGRATION_CANONICAL_PATH}$`, "i") }),
    ).not.toBeInTheDocument();
  });

  it("labels claim discipline and follow-ups for accessibility parity", () => {
    render(<AzureBoardsIntegrationEvidenceOrientationStrip />);

    const claim = screen.getByTestId("azure-boards-integration-claim-discipline");
    expect(claim).toHaveAttribute("aria-labelledby", AZURE_BOARDS_INTEGRATION_CLAIM_HEADING_ID);
    expect(screen.getByRole("heading", { name: AZURE_BOARDS_INTEGRATION_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: AZURE_BOARDS_INTEGRATION_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByText(/Sources package/i)).toBeNull();
  });
});
