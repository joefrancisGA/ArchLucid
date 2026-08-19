import { AZURE_BOARDS_INTEGRATION_CANONICAL_PATH } from "@/lib/azure-boards-integration-evidence-copy";
import { AZURE_BOARDS_TEST_CONNECTION_LABEL } from "@/lib/azure-boards-page-copy";

export type AzureBoardsHelpSetupStepCta = {
  readonly label: string;
  readonly href: string;
  readonly testId: string;
};

/** TB-1620 — deep links for numbered setup steps that must open the integration surface. */
export const AZURE_BOARDS_HELP_SETUP_STEP_CTAS = {
  openIntegration: {
    label: "Integrations → Azure Boards",
    href: AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
    testId: "help-azure-boards-setup-step-1-cta",
  },
  testConnection: {
    label: AZURE_BOARDS_TEST_CONNECTION_LABEL,
    href: AZURE_BOARDS_INTEGRATION_CANONICAL_PATH,
    testId: "help-azure-boards-setup-test-connection-cta",
  },
} satisfies Record<string, AzureBoardsHelpSetupStepCta>;

export function azureBoardsHelpSetupStepCtas(): readonly AzureBoardsHelpSetupStepCta[] {
  return [AZURE_BOARDS_HELP_SETUP_STEP_CTAS.openIntegration, AZURE_BOARDS_HELP_SETUP_STEP_CTAS.testConnection];
}
