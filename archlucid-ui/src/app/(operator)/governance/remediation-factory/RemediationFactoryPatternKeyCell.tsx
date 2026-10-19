import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

import { RemediationFactoryPatternKeyDisclosure } from "./RemediationFactoryPatternKeyDisclosure";

type Props = {
  readonly findingId: string;
  readonly patternKey: string | null | undefined;
  readonly emptyLabel?: string;
};

export function RemediationFactoryPatternKeyCell(props: Props) {
  const trimmed = props.patternKey?.trim() ?? "";

  if (trimmed.length === 0) {
    return (
      <span className={OPERATOR_TYPOGRAPHY.helper}>
        {props.emptyLabel ?? "—"}
      </span>
    );
  }

  return (
    <div data-testid={`remediation-priority-pattern-cell-${props.findingId}`}>
      <Link
        href={`/insights/patterns/${encodeURIComponent(trimmed)}`}
        className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        Pattern
      </Link>
      <RemediationFactoryPatternKeyDisclosure findingId={props.findingId} patternKey={trimmed} />
    </div>
  );
}
