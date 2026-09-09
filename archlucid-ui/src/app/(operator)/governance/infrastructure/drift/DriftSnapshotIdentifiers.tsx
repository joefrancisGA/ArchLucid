import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DriftIdentifierRow } from "@/app/(operator)/governance/infrastructure/drift/DriftIdentifierRow";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_ID_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_IDENTIFIERS_SUMMARY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_IDENTIFIERS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_ID_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";

export function DriftSnapshotIdentifiers(props: {
  readonly snapshotId: string;
  readonly diffId: string;
  readonly open: boolean;
  readonly onToggle: (open: boolean) => void;
}): React.JSX.Element {
  return (
    <CollapsibleSection
      title={GOVERNANCE_INFRASTRUCTURE_DRIFT_IDENTIFIERS_TITLE}
      summaryLine={GOVERNANCE_INFRASTRUCTURE_DRIFT_IDENTIFIERS_SUMMARY}
      sectionTestId="infra-drift-snapshot-identifiers"
      className="mb-0"
      open={props.open}
      onToggle={props.onToggle}
    >
      <div className="grid gap-2">
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
    </CollapsibleSection>
  );
}
