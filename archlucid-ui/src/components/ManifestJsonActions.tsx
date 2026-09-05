import type { ReactElement } from "react";

import { CopyManifestButton } from "@/components/CopyManifestButton";
import { DownloadManifestButton } from "@/components/DownloadManifestButton";

type ManifestJsonActionsProps = {
  readonly runId: string;
  readonly manifestVersion?: string | null;
  readonly className?: string;
  readonly buyerPolishedLayout?: boolean;
};

/** Download + clipboard copy for committed golden manifest JSON. */
export function ManifestJsonActions(props: ManifestJsonActionsProps): ReactElement {
  const { runId, manifestVersion, className, buyerPolishedLayout } = props;

  return (
    <div className={className ?? "flex flex-wrap gap-2"} data-testid="manifest-json-actions">
      <DownloadManifestButton runId={runId} className="space-y-0" buyerPolishedLayout={buyerPolishedLayout} />
      <CopyManifestButton
        runId={runId}
        manifestVersion={manifestVersion}
        className="space-y-0"
        buyerPolishedLayout={buyerPolishedLayout}
      />
    </div>
  );
}
