import { PreFinalizeChecklistPanel } from "@/components/reviews/PreFinalizeChecklistPanel";

export type PreFinalizeChecklistSectionProps = {
  readonly runId: string;
  readonly manifestFinalized: boolean;
};

export function PreFinalizeChecklistSection(props: PreFinalizeChecklistSectionProps): React.JSX.Element {
  return (
    <section id="pre-finalize-checklist" className="scroll-mt-24">
      <PreFinalizeChecklistPanel {...props} />
    </section>
  );
}
