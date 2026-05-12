import Link from "next/link";

import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID, SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type AskBuyerRunAnchorsProps = {
  buyerPolishedShell: boolean;
  runId: string;
};

export function AskBuyerRunAnchors(props: AskBuyerRunAnchorsProps) {
  const { buyerPolishedShell, runId } = props;
  const trimmed = runId.trim();

  if (!buyerPolishedShell || trimmed.length === 0) {
    return null;
  }

  const canonical = canonicalizeDemoRunId(trimmed);

  return (
    <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-400">
      <Link
        className="font-medium text-teal-800 underline dark:text-teal-300"
        href={`/reviews/${encodeURIComponent(canonical)}`}
      >
        Open linked review
      </Link>
      {canonical === SHOWCASE_STATIC_DEMO_RUN_ID ? (
        <Link
          className="font-medium text-teal-800 underline dark:text-teal-300"
          href={`/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`}
        >
          Open manifest
        </Link>
      ) : null}
    </p>
  );
}
