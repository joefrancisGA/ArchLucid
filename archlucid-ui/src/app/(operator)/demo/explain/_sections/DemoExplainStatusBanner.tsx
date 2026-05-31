import type { DemoExplainResponse } from "@/types/demo-explain";

type Props = {
  readonly payload: DemoExplainResponse;
};

export function DemoExplainStatusBanner(props: Props) {
  const payload = props.payload;

  return (
    <div
      data-testid="demo-explain-status-banner"
      className="rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-amber-700/50 px-3 py-2 text-xs"
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
