import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AzurePermissionsHelpEvidenceOrientationStrip } from "@/components/help/AzurePermissionsHelpEvidenceOrientationStrip";
import { AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE } from "@/lib/azure-permissions-help-evidence-copy";

describe("AzurePermissionsHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline without a Sources list", () => {
    render(<AzurePermissionsHelpEvidenceOrientationStrip />);

    if (!shouldOmitClaimDisciplineBand("azure-permissions-help")) { expect(screen.getByTestId("azure-permissions-help-claim-discipline")).toHaveTextContent(
      AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("azure-permissions-help-sources")).not.toBeInTheDocument();
  });
});
