import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";
import { SECURENOW_PATH_INSPECT_RETRY_NO_AZURE_CHANGE } from "@/lib/product-line/securenow-path-inspect-copy";

export function pathInspectDetailLoadErrorRecovery(): ErrorRecoveryContractPresentation {
  return {
    whatFailed: "Path inspect did not load.",
    whatIsIntact: "The snapshot selection stays on this page.",
    nextStep: SECURENOW_PATH_INSPECT_RETRY_NO_AZURE_CHANGE,
  };
}

export function pathInspectRankLoadErrorRecovery(): ErrorRecoveryContractPresentation {
  return {
    whatFailed: "Path rank did not load.",
    whatIsIntact: "Path hops and cut points stay on this page.",
    nextStep: SECURENOW_PATH_INSPECT_RETRY_NO_AZURE_CHANGE,
  };
}