import Link from "next/link";

import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import { policyPacksEditHref } from "@/lib/policy/policy-packs-deep-link";
import { cn } from "@/lib/utils";

export type FindingPolicyPackBadgeProps = {
  readonly policyPackId: string;
  readonly policyPackLabel?: string | null;
  readonly className?: string;
  readonly onPreviewClick?: () => void;
};

/** Visible proof that a finding maps to a specific policy pack. */
export function FindingPolicyPackBadge(props: FindingPolicyPackBadgeProps): React.JSX.Element | null {
  const packId = props.policyPackId.trim();
  const labelSource =
    props.policyPackLabel !== null &&
    props.policyPackLabel !== undefined &&
    props.policyPackLabel.trim().length > 0
      ? props.policyPackLabel.trim()
      : null;

  if (packId.length === 0 && labelSource === null) {
    return null;
  }

  const statusLabel =
    labelSource !== null && packId.length > 0 && labelSource !== packId
      ? `Pack ${labelSource}`
      : labelSource !== null
        ? `Pack: ${labelSource}`
        : `Pack: ${packId}`;

  if (props.onPreviewClick !== undefined) {
    return (
      <button
        type="button"
        className={props.className}
        data-testid="finding-policy-pack-badge"
        title={`Policy pack ${packId || labelSource}`}
        onClick={props.onPreviewClick}
      >
        <StatusTag kind="neutral" label={statusLabel} />
      </button>
    );
  }

  return (
    <Link
      href={policyPacksEditHref(packId.length > 0 ? packId : labelSource ?? "")}
      className={cn(OPERATOR_LINK.inline, props.className)}
      data-testid="finding-policy-pack-badge"
      title={`Policy pack ${packId || labelSource}`}
    >
      <StatusTag kind="neutral" label={statusLabel} />
    </Link>
  );
}
