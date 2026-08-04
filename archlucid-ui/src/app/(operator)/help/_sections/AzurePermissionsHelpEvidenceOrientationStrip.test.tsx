import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AzurePermissionsHelpEvidenceOrientationStrip } from "@/app/(operator)/help/_sections/AzurePermissionsHelpEvidenceOrientationStrip";
import {
  AZURE_PERMISSIONS_HELP_CANONICAL_PATH,
  AZURE_PERMISSIONS_HELP_SOURCES,
} from "@/lib/azure-permissions-help-evidence-copy";

describe("AzurePermissionsHelpEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking azure permissions help", () => {
    render(<AzurePermissionsHelpEvidenceOrientationStrip />);

    expect(screen.getByTestId("azure-permissions-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId("azure-permissions-help-claim-discipline")).toBeInTheDocument();

    for (const link of AZURE_PERMISSIONS_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      AZURE_PERMISSIONS_HELP_SOURCES.some((link) => link.href === AZURE_PERMISSIONS_HELP_CANONICAL_PATH),
    ).toBe(false);
  });
});
