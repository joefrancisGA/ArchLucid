import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";

export type InfraDiagramsSnapshotPickerOptionsProps = {
  readonly loadingSnapshots: boolean;
  readonly diagramsSubscriptionChosen: boolean;
  readonly snapshotsEmpty: boolean;
  readonly visibleSnapshots: readonly InfraEvidenceSnapshotSummary[];
  readonly selectedSnapshotId: string;
  readonly selectedSnapshotVisibleInSubscriptionFilter: boolean;
  readonly formatSnapshotPickerLabel: (snapshot: InfraEvidenceSnapshotSummary) => string;
};

export function InfraDiagramsSnapshotPickerOptions(
  props: InfraDiagramsSnapshotPickerOptionsProps,
): React.JSX.Element {
  if (props.loadingSnapshots) {
    return <option value="">Loading snapshots…</option>;
  }

  if (!props.diagramsSubscriptionChosen) {
    return <option value="">Select a subscription first</option>;
  }

  if (props.visibleSnapshots.length === 0) {
    const emptyLabel = props.snapshotsEmpty
      ? "No snapshots available"
      : "No snapshots for this subscription";

    return <option value="">{emptyLabel}</option>;
  }

  return (
    <>
      {props.selectedSnapshotId.length === 0 || !props.selectedSnapshotVisibleInSubscriptionFilter ? (
        <option value="">Select a snapshot</option>
      ) : null}
      {props.visibleSnapshots.map((snapshot) => (
        <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
          {props.formatSnapshotPickerLabel(snapshot)}
        </option>
      ))}
    </>
  );
}
