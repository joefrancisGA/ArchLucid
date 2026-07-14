import { cn } from "@/lib/utils";
import type { DemoExplainResponse } from "@/types/demo-explain";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type Props = {
  readonly payload: DemoExplainResponse;
};

export function DemoExplainStatusBanner(props: Props) {
  const payload = props.payload;

  return (
    <div
      data-testid="demo-explain-status-banner"
      className={cn(
        "rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.helper,
      )}
    >
      <span className="font-semibold">{payload.demoStatusMessage}</span> · review{" "}
      <code>{payload.runId}</code>
      {payload.manifestVersion ? (
        <>
          {" "}
          · review <code>{payload.manifestVersion}</code>
        </>
      ) : null}{" "}
      · generated <code>{payload.generatedUtc}</code>
    </div>
  );
}
