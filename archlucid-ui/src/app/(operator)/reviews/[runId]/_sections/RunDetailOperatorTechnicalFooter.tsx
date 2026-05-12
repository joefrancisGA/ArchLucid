import type { ReactElement } from "react";

import { RunDetailTechnicalIdentifiersSection } from "@/components/RunDetailTechnicalIdentifiersSection";

type RunDetailOperatorTechnicalFooterProps = {
  readonly runId: string;
  readonly projectId: string;
  readonly createdLabel: string;
};

export function RunDetailOperatorTechnicalFooter(props: RunDetailOperatorTechnicalFooterProps): ReactElement {
  const { runId, projectId, createdLabel } = props;

  return (
    <>
      <div className="flex items-center gap-3 pt-2">
        <hr className="flex-1 border-neutral-200 dark:border-neutral-700" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
          Technical reference
        </span>
        <hr className="flex-1 border-neutral-200 dark:border-neutral-700" />
      </div>

      <RunDetailTechnicalIdentifiersSection
        runId={runId}
        projectId={projectId}
        createdLabel={createdLabel}
        buyerPolishedShell={false}
      />
    </>
  );
}
