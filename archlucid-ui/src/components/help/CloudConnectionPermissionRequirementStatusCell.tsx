import { StatusTag } from "@/components/ui/status-tag";
import type { AwsPermissionRequirementLabel } from "@/lib/aws-cloud-connection-permissions-manifest";
import { formatAwsPermissionRequirementLabel } from "@/lib/aws-cloud-connection-permissions-manifest";

type CloudConnectionPermissionRequirementStatusCellProps = {
  readonly requirement: AwsPermissionRequirementLabel;
};

function mapAwsPermissionRequirementToTagKind(
  requirement: AwsPermissionRequirementLabel,
): "success" | "neutral" | "needs-attention" {
  switch (requirement) {
    case "required":
      return "success";
    case "optional":
      return "neutral";
    case "conditional":
      return "needs-attention";
    default: {
      const exhaustive: never = requirement;

      return exhaustive;
    }
  }
}

/** StatusTag cell for cloud-connection permission matrix Requirement columns. */
export function CloudConnectionPermissionRequirementStatusCell(
  props: CloudConnectionPermissionRequirementStatusCellProps,
): React.JSX.Element {
  const label = formatAwsPermissionRequirementLabel(props.requirement);

  return (
    <StatusTag
      kind={mapAwsPermissionRequirementToTagKind(props.requirement)}
      label={label}
      data-testid="cloud-connection-permission-requirement-status-tag"
    />
  );
}
