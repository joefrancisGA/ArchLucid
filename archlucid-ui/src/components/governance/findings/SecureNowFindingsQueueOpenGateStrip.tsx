import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { SecureNowFindingsQueueOpenGate } from "@/lib/product-line/securenow-findings-queue-open-gate";
import { cn } from "@/lib/utils";

export function SecureNowFindingsQueueOpenGateStrip(props: {
  readonly openGate: SecureNowFindingsQueueOpenGate;
}): React.JSX.Element {
  const { openGate } = props;

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="securenow-findings-queue-open-gate"
    >
      <span className="font-medium text-al-text-primary">Open gate:</span> {openGate.message}{" "}
      <Link className={OPERATOR_LINK.inline} href={openGate.href} data-testid={`securenow-findings-open-gate-${openGate.id}`}>
        {openGate.ctaLabel}
      </Link>
    </p>
  );
}
