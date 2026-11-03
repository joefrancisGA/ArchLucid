import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  resolveSecureNowStopItsmOutboundHandoffHref,
  SECURENOW_PILOT_STOP_ITSM_DRAFT_DISCIPLINE,
  SECURENOW_PILOT_STOP_ITSM_FINDING_EXPORT_DRAFT_DISCIPLINE,
} from "@/lib/product-line/securenow-stop-itsm-handoff";

export type SecureNowPilotStopItsmHandoffBlockProps = {
  readonly pathId: string;
  readonly rationale: string;
  readonly findingId?: string | null;
  readonly snapshotId?: string | null;
  readonly handoffTestId?: string;
};

export function SecureNowPilotStopItsmHandoffBlock(
  props: SecureNowPilotStopItsmHandoffBlockProps,
): React.JSX.Element {
  const findingScoped = (props.findingId?.trim() ?? "").length > 0;

  return (
    <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
      <Link
        className={OPERATOR_LINK.inline}
        href={resolveSecureNowStopItsmOutboundHandoffHref({
          pathId: props.pathId,
          rationale: props.rationale,
          findingId: props.findingId,
          snapshotId: props.snapshotId,
        })}
        data-testid={props.handoffTestId ?? "securenow-pilot-stop-itsm-handoff"}
      >
        {findingScoped ? "Draft finding ITSM export" : "Draft ITSM outbound handoff"}
      </Link>
      <span className={cn("block", OPERATOR_TYPOGRAPHY.helper)}>
        {findingScoped
          ? SECURENOW_PILOT_STOP_ITSM_FINDING_EXPORT_DRAFT_DISCIPLINE
          : SECURENOW_PILOT_STOP_ITSM_DRAFT_DISCIPLINE}
      </span>
    </p>
  );
}
