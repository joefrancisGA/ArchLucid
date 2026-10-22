import type { ReactNode } from "react";

import { StatusTag } from "@/components/StatusTag";
import type { ProcurementFaqPosture } from "@/lib/procurement-help-presentation";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ProcurementHelpAnswerPostureProps = {
  readonly posture: ProcurementFaqPosture;
  readonly answerMarkdown: string;
  readonly renderInline: (text: string, keyPrefix: string) => ReactNode[];
};

export function ProcurementHelpAnswerPosture(props: ProcurementHelpAnswerPostureProps): React.JSX.Element {
  const body = props.answerMarkdown.replace(/^\*\*Answer:\*\*\s*/i, "").trim();

  return (
    <div className="space-y-2" data-testid={`procurement-help-answer-${props.posture.key}`}>
      <StatusTag kind={props.posture.kind} label={props.posture.label} />
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
        {props.renderInline(body, `procurement-answer-body-${props.posture.key}`)}
      </p>
    </div>
  );
}
