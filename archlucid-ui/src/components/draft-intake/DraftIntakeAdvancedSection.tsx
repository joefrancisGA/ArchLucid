"use client";

import type { ReactNode } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { GUIDED_INTAKE_ADVANCED_OPTIONS_LABEL } from "@/lib/guided-intake-copy";

export type DraftIntakeAdvancedSectionProps = {
  readonly children: ReactNode;
  readonly defaultOpen?: boolean;
};

/** Progressive disclosure for power-user intake tools (what-if branching, etc.). */
export function DraftIntakeAdvancedSection(props: DraftIntakeAdvancedSectionProps) {
  return (
    <CollapsibleSection
      title={GUIDED_INTAKE_ADVANCED_OPTIONS_LABEL}
      defaultOpen={props.defaultOpen === true}
      sectionTestId="draft-intake-advanced-section"
    >
      <div className="space-y-4">{props.children}</div>
    </CollapsibleSection>
  );
}
