import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

type Props = {
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
    <Link
      href={`/insights/patterns/${encodeURIComponent(trimmed)}`}
      className={cn(OPERATOR_LINK.inline, "break-all font-mono text-xs")}
    >
      {trimmed}
    </Link>
  );
}
