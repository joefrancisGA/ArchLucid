import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";

export function remediationFactoryExecutiveMetricsErrorRecovery(): ErrorRecoveryContractPresentation {
  return {
    whatFailed: "Executive remediation metrics could not be loaded.",
    whatIsIntact: "Priority queue, ranked paths, and path inspect still use their own reads.",
    nextStep: "Retry executive metrics only, or refresh the whole page when connectivity is uncertain.",
  };
}

export function remediationFactoryPriorityQueueErrorRecovery(): ErrorRecoveryContractPresentation {
  return {
    whatFailed: "The remediation priority queue could not be loaded.",
    whatIsIntact: "Executive metrics, ranked paths, and inspect panels are unchanged.",
    nextStep: "Retry the priority queue, then select a row to inspect when data returns.",
  };
}

export function remediationFactoryRankedPathsErrorRecovery(): ErrorRecoveryContractPresentation {
  return {
    whatFailed: "Ranked security evidence paths could not be loaded.",
    whatIsIntact: "Finding priority queue and executive metrics are unchanged.",
    nextStep: "Retry ranked paths, or confirm inventory snapshots exist under Extract & upload.",
  };
}

export function remediationFactoryArchitectMetricsErrorRecovery(): ErrorRecoveryContractPresentation {
  return {
    whatFailed: "Architect outcome metrics for the selected snapshot pair could not be loaded.",
    whatIsIntact: "Snapshot inventory and other remediation factory reads are unchanged.",
    nextStep: "Retry the snapshot comparison or pick a different from/to pair.",
  };
}
