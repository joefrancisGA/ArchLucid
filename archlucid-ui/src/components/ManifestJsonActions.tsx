import type { ReactElement } from "react";

import { CopyManifestButton } from "@/components/CopyManifestButton";
import { DownloadManifestButton } from "@/components/DownloadManifestButton";

type ManifestJsonActionsProps = {
  readonly runId: string;
  readonly className?: string;
};

/** Download + clipboard copy for committed golden manifest JSON. */
export function ManifestJsonActions(props: ManifestJsonActionsProps): ReactElement {
  const { runId, className } = props;

  return (
    <div className={className ?? "flex flex-wrap gap-2"} data-testid="manifest-json-actions">
      <DownloadManifestButton runId={runId} className="space-y-0" />
      <CopyManifestButton runId={runId} className="space-y-0" />
    </div>
  );
}
