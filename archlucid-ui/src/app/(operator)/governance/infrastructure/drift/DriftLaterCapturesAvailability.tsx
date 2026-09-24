import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_LATER_CAPTURES_CROSS_SUBSCRIPTION_SUFFIX,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_LATER_CAPTURES_NONE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_LATER_CAPTURES_SAME_SUBSCRIPTION_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import type { InfraEvidenceLaterSnapshotsPartition } from "@/lib/infra-evidence/infra-evidence-drift-later-snapshots";
import { cn } from "@/lib/utils";

export function DriftLaterCapturesAvailability(props: {
  readonly partition: InfraEvidenceLaterSnapshotsPartition;
}): React.JSX.Element {
  const sameCount = props.partition.sameSubscription.length;
  const crossCount = props.partition.crossSubscription.length;

  if (sameCount === 0 && crossCount === 0) {
    return (
      <p
        className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="infra-drift-later-captures-summary"
      >
        {GOVERNANCE_INFRASTRUCTURE_DRIFT_LATER_CAPTURES_NONE_LABEL}
      </p>
    );
  }

  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="infra-drift-later-captures-summary"
    >
      {sameCount > 0
        ? GOVERNANCE_INFRASTRUCTURE_DRIFT_LATER_CAPTURES_SAME_SUBSCRIPTION_LABEL(sameCount)
        : null}
      {sameCount > 0 && crossCount > 0 ? " " : null}
      {crossCount > 0 ? GOVERNANCE_INFRASTRUCTURE_DRIFT_LATER_CAPTURES_CROSS_SUBSCRIPTION_SUFFIX(crossCount) : null}
    </p>
  );
}
