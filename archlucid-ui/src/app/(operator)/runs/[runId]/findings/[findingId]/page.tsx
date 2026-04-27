import Link from "next/link";

import { CopyIdButton } from "@/components/CopyIdButton";
import { FindingExplainPanel } from "@/components/FindingExplainPanel";

/** Deep-linkable “Explain this finding” view: redacted LLM audit + evidence-chain pointers (ReadAuthority-gated inside the panel). */
export default async function RunFindingExplainPage({
  params,
}: {
  params: Promise<{ runId: string; findingId: string }>;
}) {
  const { runId, findingId } = await params;
  const decodedFindingId = decodeURIComponent(findingId);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
        <Link
          href={`/runs/${runId}`}
          className="text-teal-800 underline decoration-neutral-300 underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:decoration-neutral-600 dark:hover:text-teal-200"
        >
          ← Back to architecture run
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Finding details</h1>
      <p className="m-0 flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <code className="max-w-full break-all rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono dark:bg-neutral-800">
          {decodedFindingId}
        </code>
        <CopyIdButton value={decodedFindingId} aria-label="Copy finding ID" />
      </p>
      <p className="m-0 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        Evidence, rationale, and decision trace for this finding.
      </p>
      <FindingExplainPanel runId={runId} findingId={findingId} />
    </div>
  );
}
