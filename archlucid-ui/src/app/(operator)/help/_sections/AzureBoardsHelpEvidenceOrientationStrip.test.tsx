import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AzureBoardsHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/AzureBoardsHelpEvidenceOrientationStrip";
import {
  AZURE_BOARDS_HELP_CANONICAL_PATH,
  AZURE_BOARDS_HELP_SOURCES,
} from "@/lib/azure-boards-help-evidence-copy";

describe("AzureBoardsHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking azure-boards help", () => {
    render(<AzureBoardsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("azure-boards-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("azure-boards-help-claim-discipline")).toBeInTheDocument();

    for (const link of AZURE_BOARDS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(AZURE_BOARDS_HELP_SOURCES.some((link) => link.href === AZURE_BOARDS_HELP_CANONICAL_PATH)).toBe(
      false,
    );
  });
});
