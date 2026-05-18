import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type AskContextParagraphProps = {
  buyerPolishedShell: boolean;
  runId: string;
};

export function AskContextParagraph(props: AskContextParagraphProps) {
  const { buyerPolishedShell, runId } = props;

  return (
    <div className="mb-4 max-w-3xl space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
      {buyerPolishedShell ? (
        <>
          <p className="m-0">
            Example answers are illustrative; tenant-backed workspaces anchor replies to persisted review evidence and source
            links.
          </p>
          <details className="rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40">
            <summary className="cursor-pointer text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Validation note (approvals)
            </summary>
            <p className="m-0 mt-2 text-xs leading-relaxed">
              Validate conclusions against your finalized signed manifest before approvals — Ask does not replace formal
              sign-off records.
            </p>
          </details>
          {canonicalizeDemoRunId(runId.trim()) === SHOWCASE_STATIC_DEMO_RUN_ID ? (
            <p className="m-0 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              On the Claims Intake sample review, replies include quick links to manifest, evidence trail, governance, and audit
              anchors where available.
            </p>
          ) : null}
        </>
      ) : (
        <p className="m-0">
          Answers use the review context you select (finalized manifest and findings when available; reviews in progress may omit
          late-stage outputs until the pipeline completes).
        </p>
      )}
    </div>
  );
}
