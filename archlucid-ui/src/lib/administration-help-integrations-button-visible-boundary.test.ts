import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { findButtonVisibleBoundaryViolations } from "@/lib/button-visible-boundary-source-patterns";

const REPO_ROOT = join(process.cwd());

/** Administration, help, integrations, and usability-dense controls from TB-2173 — ghost migration landed in TB-2168. */
const ADMINISTRATION_HELP_INTEGRATIONS_BUTTON_PATHS = [
  "src/app/(operator)/administration/auth-domains/AuthDomainsPageClient.tsx",
  "src/app/(operator)/administration/users/_sections/SettingsRolesInvitePanel.tsx",
  "src/app/(operator)/administration/users/_sections/InviteReviewerPageView.tsx",
  "src/app/(operator)/administration/users/_sections/SettingsRolesMatrixSection.tsx",
  "src/app/(operator)/administration/users/_sections/PendingInvitationsPanel.tsx",
  "src/app/(operator)/administration/account-security/AccountSecurityPageClient.tsx",
  "src/app/(operator)/administration/model-governance/_sections/ModelGovernanceSettingsCard.tsx",
  "src/app/(operator)/administration/workspace-settings/_sections/TenantQualityGatesCard.tsx",
  "src/app/(operator)/integrations/teams/_sections/TeamsNotificationsSelector.tsx",
  "src/app/(operator)/integrations/slack/_sections/SlackDestinationsPanel.tsx",
  "src/components/alerts/AlertRoutingContent.tsx",
  "src/components/HelpSearchPanel.tsx",
  "src/components/help/HelpMarkdownCodeBlock.tsx",
  "src/app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesClient.tsx",
  "src/components/usability/PageContextualHelpButton.tsx",
  "src/components/usability/PageScopedContextualHelpPanel.tsx",
  "src/components/usability/TechnicalIdDisclosure.tsx",
  "src/components/usability/ProductConceptsGlossaryDialog.tsx",
  "src/components/usability/UsabilityFeedbackWidget.tsx",
  "src/components/usability/RunsListCompareSelectionBar.tsx",
  "src/components/operator-home/OperatorHomeDisclosureSection.tsx",
  "src/components/operator-home/OperatorHomeWorkspaceContextDisclosure.tsx",
  "src/components/AdvancedOptionsAccordion.tsx",
  "src/components/CopyIdButton.tsx",
  "src/components/InspectorPanel.tsx",
  "src/components/operator/OperatorRouteDiagnosticsPanel.tsx",
  "src/components/PilotBaselineWizard.tsx",
  "src/components/wizard/PilotModePolicyPackToggle.tsx",
  "src/components/wizard/steps/WizardStepConstraints.tsx",
  "src/components/wizard/steps/WizardStepAdvanced.tsx",
  "src/components/architecture/ArchitectureDiagramEditor.tsx",
] as const;

describe("administration / help / integrations button visible-boundary guard (TB-2173)", () => {
  it.each(ADMINISTRATION_HELP_INTEGRATIONS_BUTTON_PATHS)(
    "does not emit ghost/link Button variants in %s",
    (relativePath) => {
      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");
      const violations = findButtonVisibleBoundaryViolations(source);

      expect(violations, `${relativePath}: use outline per UI_DESIGN_SYSTEM.md § TB-2168`).toEqual([]);
    },
  );
});
