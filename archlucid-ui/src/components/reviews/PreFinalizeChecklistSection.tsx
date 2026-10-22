import { PreFinalizeChecklistPanel } from "@/components/reviews/PreFinalizeChecklistPanel";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";

export type PreFinalizeChecklistSectionProps = {
  readonly runId: string;
  readonly manifestFinalized: boolean;
  readonly workingCareerRehearsalDoor?: string | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
};

export function PreFinalizeChecklistSection(props: PreFinalizeChecklistSectionProps): React.JSX.Element {
  return (
    <section id="pre-finalize-checklist" className="scroll-mt-24">
      <PreFinalizeChecklistPanel {...props} />
    </section>
  );
}
