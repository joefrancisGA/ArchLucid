"use client";

import type { JSX, ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const OPERATOR_RELATED_SURFACES_DISCLOSURE_TITLE = "Related surfaces";

export type OperatorRelatedSurfacesDisclosureProps = {
  readonly children: ReactNode;
  readonly className?: string;
  readonly testId: string;
  readonly title?: string;
};

/** Collapses stacked vocabulary rails and capability strips above the primary work object. */
export function OperatorRelatedSurfacesDisclosure(
  props: OperatorRelatedSurfacesDisclosureProps,
): JSX.Element {
  const title = props.title ?? OPERATOR_RELATED_SURFACES_DISCLOSURE_TITLE;

  return (
    <details
      className={cn("rounded-lg border border-neutral-200 dark:border-neutral-800", props.className)}
      data-testid={props.testId}
    >
      <summary className={cn("cursor-pointer px-4 py-2", OPERATOR_TYPOGRAPHY.cardTitle)}>{title}</summary>
      <div className="space-y-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">{props.children}</div>
    </details>
  );
}
