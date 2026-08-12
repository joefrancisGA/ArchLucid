import type { ReactElement, ReactNode } from "react";

export type OperatorToolingWorkbenchPanelsProps = {
  readonly inputsHeadingId: string;
  readonly inputsHeading: string;
  readonly behaviorHeadingId: string;
  readonly behaviorHeading: string;
  readonly inputs: ReactNode;
  readonly behavior: ReactNode;
  readonly inputsGridClassName?: string;
};

/** Simulation/tuning workbench: inputs panel stacked above current-behavior panel. */
export function OperatorToolingWorkbenchPanels(props: OperatorToolingWorkbenchPanelsProps): ReactElement {
  return (
    <>
      <section aria-labelledby={props.inputsHeadingId}>
        <h3 id={props.inputsHeadingId} className="mt-0">
          {props.inputsHeading}
        </h3>
        <div className={props.inputsGridClassName}>{props.inputs}</div>
      </section>
      <section aria-labelledby={props.behaviorHeadingId} className="mt-6">
        <h3 id={props.behaviorHeadingId} className="mt-0">
          {props.behaviorHeading}
        </h3>
        {props.behavior}
      </section>
    </>
  );
}
