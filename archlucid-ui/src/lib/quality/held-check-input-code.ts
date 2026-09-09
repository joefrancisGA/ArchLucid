/** Closed missing-input codes mirrored from ArchLucid.Contracts.Findings.HeldCheckInputCode (DX-52). */
export type HeldCheckInputCode =
  | "azureInventoryZip"
  | "awsInventoryZip"
  | "gcpInventoryZip"
  | "actorNodes"
  | "rbacBindings"
  | "secretRotationMetadata"
  | "replicaOrFailoverProperties"
  | "networkPolicyRules"
  | "priorRunSnapshot"
  | "assignedPolicyPack";

const OPERATOR_LABELS: Record<HeldCheckInputCode, string> = {
  azureInventoryZip: "Azure inventory ZIP",
  awsInventoryZip: "AWS inventory ZIP",
  gcpInventoryZip: "GCP inventory ZIP",
  actorNodes: "Actor nodes",
  rbacBindings: "RBAC / IAM bindings",
  secretRotationMetadata: "secret rotation metadata",
  replicaOrFailoverProperties: "replica or failover properties",
  networkPolicyRules: "NSG / NetworkPolicy rules",
  priorRunSnapshot: "prior-run snapshot",
  assignedPolicyPack: "assigned policy pack",
};

export function formatHeldCheckInputCodeLabel(inputCode: HeldCheckInputCode): string {
  return OPERATOR_LABELS[inputCode];
}

export function formatHeldCheckUnblockClause(engineCount: number, inputCode: HeldCheckInputCode): string {
  const label = formatHeldCheckInputCodeLabel(inputCode);

  return engineCount === 1
    ? `Uploading ${label} would unblock 1 engine.`
    : `Uploading ${label} would unblock ${engineCount} engines.`;
}

export function formatProseAssumptionHeldCheckAskClause(ask: {
  readonly inputCode: HeldCheckInputCode;
  readonly statement: string;
  readonly evidenceRef: string;
}): string {
  const label = formatHeldCheckInputCodeLabel(ask.inputCode);
  const reason = ask.evidenceRef.trim().length > 0
    ? `${ask.statement} (${ask.evidenceRef})`
    : ask.statement;

  return `Upload ${label} to verify: '${reason}'.`;
}
