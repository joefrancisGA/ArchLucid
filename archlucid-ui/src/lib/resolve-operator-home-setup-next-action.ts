import {
  OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH,
  OPERATOR_HOME_SETUP_NEXT_CONNECT_CLOUD,
  OPERATOR_HOME_SETUP_NEXT_INVITE_REVIEWER,
  OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE,
} from "@/lib/buyer/buyer-polish-copy";

export type OperatorHomeSetupNextActionId = "guide" | "cloud" | "reviewer" | "path";

/** Buyer-facing setup card next-step label — guide first, then optional cloud and reviewer paths. */
export function resolveOperatorHomeSetupNextAction(
  actionId: OperatorHomeSetupNextActionId = "guide",
): string {
  switch (actionId) {
    case "cloud":
      return OPERATOR_HOME_SETUP_NEXT_CONNECT_CLOUD;
    case "reviewer":
      return OPERATOR_HOME_SETUP_NEXT_INVITE_REVIEWER;
    case "guide":
      return OPERATOR_HOME_SETUP_NEXT_OPEN_GUIDE;
    case "path":
      return OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH;
    default: {
      const _exhaustive: never = actionId;
      return _exhaustive;
    }
  }
}

/** Picks the next setup emphasis after internal finish-setup steps are complete. */
export function resolveOperatorHomeSetupNextActionId(
  readyCount: number,
  totalCount: number,
): OperatorHomeSetupNextActionId {
  if (totalCount > 0 && readyCount >= totalCount) {
    return "cloud";
  }

  if (readyCount === 0) {
    return "path";
  }

  return "guide";
}
