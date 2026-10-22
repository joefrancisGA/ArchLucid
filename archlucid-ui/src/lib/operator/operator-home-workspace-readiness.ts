import type { FinishSetupWizardContext } from "@/lib/finish-setup-wizard-steps";
import { isSelfHostedDeploymentEnv } from "@/lib/finish-setup-deployment";
import {
  OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
  OPERATOR_HOME_HEALTH_BLOCKER,
} from "@/lib/buyer/buyer-polish-copy";

export type OperatorHomeWorkspaceReadiness = {
  readonly canBegin: boolean;
  readonly blockerMessage: string | null;
};

/** Whether the workspace has a real prerequisite before create/review — optional cloud and invites never block. */
export function resolveOperatorHomeWorkspaceReadiness(
  ctx: FinishSetupWizardContext,
): OperatorHomeWorkspaceReadiness {
  if (isSelfHostedDeploymentEnv() && (!ctx.healthReady || ctx.healthLoadFailed)) {
    return {
      canBegin: false,
      blockerMessage: OPERATOR_HOME_HEALTH_BLOCKER,
    };
  }

  if (!ctx.principalAdmin) {
    return {
      canBegin: false,
      blockerMessage: OPERATOR_HOME_ASSIGN_ADMIN_BLOCKER,
    };
  }

  return {
    canBegin: true,
    blockerMessage: null,
  };
}
