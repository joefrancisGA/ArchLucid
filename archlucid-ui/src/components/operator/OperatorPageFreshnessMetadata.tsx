"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type OperatorPageFreshnessMetadataProps = {
  readonly testId: string;
  readonly children: ReactNode;
  readonly lastRefreshedAt: Date | null | undefined;
  readonly className?: string;
};

/**
 * Operator header freshness line. When a timestamp exists, wraps copy in `<time dateTime>`
 * so keyboard and touch users get the absolute reading without a mouse-only `title`.
 */
export function OperatorPageFreshnessMetadata(
  props: OperatorPageFreshnessMetadataProps,
): React.JSX.Element {
  const className = cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper, props.className);

  if (props.lastRefreshedAt === null || props.lastRefreshedAt === undefined) {
    return (
      <span className={className} data-testid={props.testId}>
        {props.children}
      </span>
    );
  }

  return (
    <time
      className={className}
      data-testid={props.testId}
      dateTime={props.lastRefreshedAt.toISOString()}
    >
      {props.children}
    </time>
  );
}
