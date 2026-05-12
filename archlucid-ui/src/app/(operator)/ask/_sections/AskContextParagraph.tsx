import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type AskContextParagraphProps = {
  buyerPolishedShell: boolean;
  runId: string;
};

export function AskContextParagraph(props: AskContextParagraphProps) {
  const { buyerPolishedShell, runId } = props;

  return (
    <p className="mb-4 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
      {buyerPolishedShell ? (
        <>
          Answers tie to the review you attach. Finalized packages pair best with manifest, findings, evidence graph, and
          audit trail checks.
          {canonicalizeDemoRunId(runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID ? (
            <>
              {" "}
              On the Claims Intake sample review, assistant replies include quick links to those anchors.
            </>
          ) : null}
        </>
      ) : (
        <>
          Answers use the review context you select (finalized manifest and findings when available; reviews in progress may
          omit late-stage outputs until the pipeline completes).
        </>
      )}
    </p>
  );
}
