import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowFindingsQueueOpenGate } from "@/lib/product-line/securenow-findings-queue-open-gate";
import {
  SECURENOW_FINDINGS_OPEN_GATE_ADDITIONAL_LABEL,
  SECURENOW_FINDINGS_OPEN_GATE_PRIMARY_LABEL,
} from "@/lib/product-line/securenow-findings-queue-open-gate-strip-copy";
import { cn } from "@/lib/utils";

function OpenGateRow(props: { readonly openGate: SecureNowFindingsQueueOpenGate }): React.JSX.Element {
  return (
    <p className="m-0">
      {props.openGate.message}{" "}
      <Link
        className={OPERATOR_LINK.inline}
        href={props.openGate.href}
        data-testid={`securenow-findings-open-gate-${props.openGate.id}`}
      >
        {props.openGate.ctaLabel}
      </Link>
    </p>
  );
}

export function SecureNowFindingsQueueOpenGateStrip(props: {
  readonly openGates: ReadonlyArray<SecureNowFindingsQueueOpenGate>;
}): React.JSX.Element {
  const primaryGate = props.openGates[0] ?? null;
  const additionalGates = props.openGates.slice(1);

  return (
    <div
      className={cn("space-y-2", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="securenow-findings-queue-open-gate"
    >
      {primaryGate !== null ? (
        <div className="space-y-1" data-testid="securenow-findings-open-gate-primary">
          <p className="m-0 font-medium text-al-text-primary">{SECURENOW_FINDINGS_OPEN_GATE_PRIMARY_LABEL}</p>
          <OpenGateRow openGate={primaryGate} />
        </div>
      ) : null}
      {additionalGates.length > 0 ? (
        <div className="space-y-1" data-testid="securenow-findings-open-gate-additional">
          <p className="m-0 font-medium text-al-text-primary">{SECURENOW_FINDINGS_OPEN_GATE_ADDITIONAL_LABEL}</p>
          {additionalGates.map((openGate) => (
            <OpenGateRow key={openGate.id} openGate={openGate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
