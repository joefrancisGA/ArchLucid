import type { DemoExplainResponse } from "@/types/demo-explain";

type Props = {
  readonly payload: DemoExplainResponse;
};

export function DemoExplainStatusBanner(props: Props) {
  const payload = props.payload;

  return (
    <div
      data-testid="demo-explain-status-banner"
      className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
    >
      <span className="font-semibold">{payload.demoStatusMessage}</span> · review{" "}
      <code>{payload.runId}</code>
      {payload.manifestVersion ? (
        <>
          {" "}
          · manifest <code>{payload.manifestVersion}</code>
        </>
      ) : null}{" "}
      · generated <code>{payload.generatedUtc}</code>
    </div>
  );
}
