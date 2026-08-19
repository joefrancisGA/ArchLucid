import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AzurePermissionsHelpEvidenceOrientationStrip } from "@/components/help/AzurePermissionsHelpEvidenceOrientationStrip";
import { expectClaimDisciplineBand } from "@/lib/claim-discipline-test-helpers";
import { AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE } from "@/lib/azure-permissions-help-evidence-copy";
import { shouldOmitClaimDisciplineBand } from "@/lib/claim-discipline-policy";

describe("AzurePermissionsHelpEvidenceOrientationStrip", () => {
  it("renders claim discipline without a Sources list", () => {
    render(<AzurePermissionsHelpEvidenceOrientationStrip />);

    expectClaimDisciplineBand(screen, "azure-permissions-help", "azure-permissions-help-claim-discipline");

    if (!shouldOmitClaimDisciplineBand("azure-permissions-help")) {
      expect(screen.getByTestId("azure-permissions-help-claim-discipline")).toHaveTextContent(
        AZURE_PERMISSIONS_HELP_CLAIM_DISCIPLINE,
      );
    }

    expect(screen.queryByTestId("azure-permissions-help-sources")).not.toBeInTheDocument();
  });
});
