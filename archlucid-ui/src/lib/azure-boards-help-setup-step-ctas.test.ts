import { describe, expect, it } from "vitest";

import {
  AZURE_BOARDS_HELP_SETUP_STEP_CTAS,
  azureBoardsHelpSetupStepCtas,
} from "@/lib/azure-boards-help-setup-step-ctas";
import { AZURE_BOARDS_INTEGRATION_CANONICAL_PATH } from "@/lib/azure-boards-integration-evidence-copy";

describe("azure-boards help setup step CTAs (TB-1620)", () => {
  it("routes setup step 1 and test connection to the integration surface", () => {
    expect(AZURE_BOARDS_HELP_SETUP_STEP_CTAS.openIntegration.href).toBe(
      AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
    );
    expect(AZURE_BOARDS_HELP_SETUP_STEP_CTAS.testConnection.href).toBe(
      AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
    );
    expect(azureBoardsHelpSetupStepCtas()).toHaveLength(2);
  });
});
