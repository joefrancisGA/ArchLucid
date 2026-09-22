import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { operatorLastRefreshedClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { cn } from "@/lib/utils";

export type OperatorAdvisorySimulatorProvenanceBlockProps = {
  readonly title: string;
  readonly simulatorTag: string;
  readonly ruleVersion: string | null;
  readonly generatedAt: Date | string | null;
  readonly targetLabel: string;
  readonly body: string;
  readonly auditTrailRecorded: boolean;
  readonly testId?: string;
};

/** Structured simulator output with provenance — not a raw pre dump. */
export function OperatorAdvisorySimulatorProvenanceBlock(
  props: OperatorAdvisorySimulatorProvenanceBlockProps,
): React.JSX.Element {
  const generatedClock =
    props.generatedAt instanceof Date
      ? operatorLastRefreshedClockLabel(props.generatedAt)
      : props.generatedAt !== null
        ? operatorLastRefreshedClockLabel(new Date(props.generatedAt))
        : null;

  return (
    <div
      className="space-y-2 rounded border border-border bg-muted/30 p-3"
      data-testid={props.testId ?? "operator-advisory-simulator-provenance"}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>{props.title}</h3>
        <StatusTag kind="neutral" label={props.simulatorTag} />
      </div>
      <dl className={cn("m-0 grid gap-1", OPERATOR_TYPOGRAPHY.helper)}>
        <div>
          <dt className="inline font-medium text-foreground">Target:</dt>{" "}
          <dd className="inline m-0">{props.targetLabel}</dd>
        </div>
        {props.ruleVersion !== null ? (
          <div>
            <dt className="inline font-medium text-foreground">Rule version:</dt>{" "}
            <dd className="inline m-0">{props.ruleVersion}</dd>
          </div>
        ) : null}
        {generatedClock !== null ? (
          <div>
            <dt className="inline font-medium text-foreground">Generated:</dt>{" "}
            <dd className="inline m-0">{generatedClock}</dd>
          </div>
        ) : null}
        <div>
          <dt className="inline font-medium text-foreground">Audit trail:</dt>{" "}
          <dd className="inline m-0">
            {props.auditTrailRecorded
              ? "Recorded as an operator advisory action in this session."
              : "Not recorded — advisory simulator output only."}
          </dd>
        </div>
      </dl>
      <p className={cn("m-0 whitespace-pre-wrap", OPERATOR_TYPOGRAPHY.body)}>{props.body}</p>
    </div>
  );
}
