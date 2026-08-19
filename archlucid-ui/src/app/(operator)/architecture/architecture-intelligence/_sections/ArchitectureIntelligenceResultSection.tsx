import type { ReactNode } from "react";

import { ARCHITECTURE_INTELLIGENCE_SECTION_SHELL_CLASS } from "@/app/(operator)/architecture/architecture-intelligence/_sections/architecture-intelligence-section-shell";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ResultSectionProps = {
  title: string;
  testId: string;
  children: ReactNode;
};

export function ArchitectureIntelligenceResultSection(props: ResultSectionProps) {
  return (
    <section
      className={ARCHITECTURE_INTELLIGENCE_SECTION_SHELL_CLASS}
      data-testid={props.testId}
    >
      <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{props.title}</h2>
      {props.children}
    </section>
  );
}
