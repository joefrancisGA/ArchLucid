import type { ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { cn } from "@/lib/utils";

export function RemediationFactoryBorderedSection(props: {
  readonly title: string;
  readonly testId: string;
  readonly children: ReactNode;
  readonly headerAside?: ReactNode;
  readonly className?: string;
}) {
  return (
    <section
      className={cn("space-y-3 rounded border border-border p-4", props.className)}
      aria-label={props.title}
      data-testid={props.testId}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{props.title}</h2>
        {props.headerAside}
      </div>
      {props.children}
    </section>
  );
}
