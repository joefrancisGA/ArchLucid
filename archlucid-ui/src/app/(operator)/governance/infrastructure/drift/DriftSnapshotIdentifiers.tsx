import { DriftIdentifierRow } from "@/app/(operator)/governance/infrastructure/drift/DriftIdentifierRow";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_ID_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_ID_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";

export function DriftSnapshotIdentifiers(props: {
  readonly snapshotId: string;
  readonly diffId: string;
  readonly architectureName?: string | null;
}): React.JSX.Element {
  const architectureName = props.architectureName?.trim() ?? "";

  return (
    <div className="grid gap-2" data-testid="infra-drift-snapshot-identifiers">
      {architectureName.length > 0 ? (
        <DriftIdentifierRow
          label="Architecture"
          value={architectureName}
          copyAriaLabel="Copy architecture name"
        />
      ) : null}
      <DriftIdentifierRow
        label={GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_ID_LABEL}
        value={props.snapshotId}
        copyAriaLabel="Copy snapshot id"
      />
      {props.diffId.length > 0 ? (
        <DriftIdentifierRow
          label={GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_ID_LABEL}
          value={props.diffId}
          copyAriaLabel="Copy diff id"
        />
      ) : null}
    </div>
  );
}
