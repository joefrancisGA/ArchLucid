import type { ReactNode } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ResultSectionProps = {
  title: string;
  testId: string;
  children: ReactNode;
};

export function ArchitectureIntelligenceResultSection(props: ResultSectionProps) {
  return (
    <section data-testid={props.testId}>
      <h2 className={cn("mb-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>{props.title}</h2>
      {props.children}
    </section>
  );
}
