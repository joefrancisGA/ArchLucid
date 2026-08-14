"use client";

import type { ReactNode, ReactElement } from "react";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";

type RunDetailOperatorTechnicalDisclosureProps = {
  readonly children: ReactNode;
};

/** Operator run detail: LLM cost, agent logs, traces, and metadata default closed. */
export function RunDetailOperatorTechnicalDisclosure(
  props: RunDetailOperatorTechnicalDisclosureProps,
): ReactElement {
  return (
    <div data-testid="run-detail-advanced-options">
      <AdvancedOptionsAccordion triggerLabel="Technical details" defaultOpen={false} className="scroll-mt-24">
        <div className="space-y-4">{props.children}</div>
      </AdvancedOptionsAccordion>
    </div>
  );
}
