/** UI types for IE-UX-05 remediation factory workbench. */

export type RemediationInstanceStatus =
  | "Classified"
  | "PreflightPassed"
  | "PreflightBlocked"
  | "Approved"
  | "WaveAssigned"
  | "Executed"
  | "Verified"
  | "VerificationFailed"
  | "Closed";

export type RemediationWorkbenchColumn =
  | "draft"
  | "preflight"
  | "approved"
  | "executed"
  | "verified"
  | "closed";

export type RemediationInstanceSummary = {
  instanceId: string;
  findingId: string;
  patternKey: string;
  status: RemediationInstanceStatus;
  automationLevel: string;
  cloudResourceId: string | null;
  waveId: string | null;
  createdUtc: string;
  updatedUtc: string;
};

export type RemediationInstanceEvidenceSummary = {
  evidenceId: string;
  phase: string;
  payloadJson: string;
  createdUtc: string;
};

export type RemediationPatternMatchSummary = {
  matchResultId: string;
  patternKey: string;
  patternVersion: string;
  matchKind: string;
  explainText: string;
};

export type OperationalSecurityFindingSummary = {
  findingId: string;
  title: string;
  severity: string | null;
  status: string | null;
  cloudResourceId: string | null;
  controlId: string | null;
};

export type RemediationInstanceDetail = {
  instance: RemediationInstanceSummary;
  finding: OperationalSecurityFindingSummary | null;
  activeMatch: RemediationPatternMatchSummary | null;
  evidence: RemediationInstanceEvidenceSummary[];
};

export type RemediationInstanceOperationResult = {
  succeeded: boolean;
  instanceId: string | null;
  status: RemediationInstanceStatus | null;
  blockers: string[];
  errorMessage: string | null;
};

export type RemediationWaveProgressSummary = {
  waveId: string;
  name: string;
  status: string;
  memberCount: number;
  targetSize: number | null;
};

export type RemediationFactoryWorkbenchSummary = {
  factoryMetrics: {
    openFindings: number;
    remediatedThisWeek: number;
    verificationFailureCount: number;
    businessBlockedCount: number;
  };
  openInstancesByStatus: Record<string, number>;
  waves: RemediationWaveProgressSummary[];
};

export type RemediationPrioritizedFinding = {
  findingId: string;
  totalScore: number;
  explanationSummary: string;
  cloudResourceId: string | null;
  controlId: string | null;
  patternKey: string | null;
};

export const REMEDIATION_EXECUTE_DISCLAIMER =
  "Execute emits advisory Terraform artifacts only. Nothing is applied to Azure or ARM." as const;

export const REMEDIATION_WORKBENCH_COLUMNS: readonly {
  readonly id: RemediationWorkbenchColumn;
  readonly label: string;
}[] = [
  { id: "draft", label: "Draft" },
  { id: "preflight", label: "Preflight" },
  { id: "approved", label: "Approved" },
  { id: "executed", label: "Executed" },
  { id: "verified", label: "Verified" },
  { id: "closed", label: "Closed" },
];
