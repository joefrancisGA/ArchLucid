import { TechnologyBaselinePanel } from "@/components/reviews/technology-baseline/TechnologyBaselinePanel";

export type TechnologyBaselineSectionProps = {
  readonly runId: string;
  readonly manifestFinalized: boolean;
  readonly buyerPolished: boolean;
  readonly usedStaticDemoRun: boolean;
  readonly warningCountDisplay: number;
};

export function TechnologyBaselineSection(props: TechnologyBaselineSectionProps): React.JSX.Element {
  return (
    <section id="technology-baseline" className="scroll-mt-24">
      <TechnologyBaselinePanel {...props} />
    </section>
  );
}
