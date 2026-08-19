import type { ReactElement } from "react";

import { RunDetailTechnicalIdentifiersSection } from "@/components/runs/RunDetailTechnicalIdentifiersSection";
import { OPERATOR_NAV_GROUP_LABEL } from "@/lib/design-tokens";

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
        <span className={OPERATOR_NAV_GROUP_LABEL}>
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
