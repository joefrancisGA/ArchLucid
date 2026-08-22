import type { ReactNode } from "react";

import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureDraftFormSectionProps = {
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
  readonly isFirst?: boolean;
};

/** Labeled draft form section with a stable anchor for readiness jump links. */
export function ArchitectureDraftFormSection(props: ArchitectureDraftFormSectionProps): React.JSX.Element {
  const headingId = `${props.id}-heading`;

  return (
    <section
      id={props.id}
      aria-labelledby={headingId}
      className={cn(!props.isFirst && "border-t border-al-border pt-6", "scroll-mt-24")}
      data-testid={props.id}
    >
      <h2 id={headingId} className={cn("m-0 mb-4", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {props.title}
      </h2>
      <div className={OPERATOR_LAYOUT.sectionStack}>{props.children}</div>
    </section>
  );
}
