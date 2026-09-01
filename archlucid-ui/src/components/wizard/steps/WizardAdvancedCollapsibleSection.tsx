"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement, ReactNode } from "react";

import { DisclosureTriangleIndicator } from "@/components/DisclosureTriangleIndicator";
import { Badge } from "@/components/ui/badge";

export function WizardAdvancedCollapsibleSection(props: {
  title: string;
  count: number;
  children: ReactNode;
}): ReactElement {
  return (
    <details className="group rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-neutral-900 marker:content-none dark:text-neutral-100 [&::-webkit-details-marker]:hidden">
        <DisclosureTriangleIndicator />
        <span className="flex flex-wrap items-center gap-2">
          <span>{props.title}</span>
          {props.count > 0 ? (
            <Badge variant="secondary" className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>
              {props.count}
            </Badge>
          ) : null}
        </span>
      </summary>
      <div className="mt-4 space-y-4">{props.children}</div>
    </details>
  );
}
