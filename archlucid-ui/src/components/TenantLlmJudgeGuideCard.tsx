import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Settings guidance for enabling LLM-as-judge (opt-in; budget impact). */
export function TenantLlmJudgeGuideCard(): React.JSX.Element {
  return (
    <Card data-testid="tenant-llm-judge-guide-card">
      <CardHeader>
        <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.body}>LLM-as-judge (advanced quality)</CardTitle>
        <CardDescription>
          Semantic evaluation beyond heuristic structural checks. Disabled by default to control LLM spend; enable when
          pilots need deeper automated oversight.
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0">
          Semantic evaluation is a deployment option for this workspace. Ask your ArchLucid administrator if you need it
          turned on. A daily token budget applies when it is enabled.
        </p>
        <p className="m-0">
          Pair with tenant quality-gate mode below — <strong>Strict quality</strong> blocks runs on reject;{" "}
          <strong>Warn only</strong> surfaces warnings without halting the pipeline.
        </p>
      </CardContent>
    </Card>
  );
}
