import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";

type RunDetailOperatorPipelineToolsCollapsibleProps = {
  readonly runId: string;
};

export function RunDetailOperatorPipelineToolsCollapsible(
  props: RunDetailOperatorPipelineToolsCollapsibleProps,
): ReactElement {
  const { runId } = props;

  return (
    <CollapsibleSection title="Pipeline tools (operator)" defaultOpen={false}>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/replay?runId=${encodeURIComponent(runId)}`}>Replay this review</Link>
        </Button>
      </div>
    </CollapsibleSection>
  );
}
