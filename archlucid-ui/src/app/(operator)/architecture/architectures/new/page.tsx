import type { Metadata } from "next";

import { ArchitectureDraftWorkspace } from "@/components/architecture/ArchitectureDraftWorkspace";
import { OperatorPageContainer } from "@/components/OperatorPageContainer";
import { ARCHITECTURE_NEW_DRAFT_SEGMENT } from "@/lib/architecture-routes";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";

export const metadata: Metadata = {
  title: CREATE_ARCHITECTURE_LABEL,
};

/**
 * Direct drafting entry — no draft interstitial. Server persist waits until the operator
 * enters saveable field content ({@link ArchitectureDraftWorkspace} deferred create).
 */
export default function NewArchitecturePage(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="workflow">
      <div className="mt-6">
        <ArchitectureDraftWorkspace architectureId={ARCHITECTURE_NEW_DRAFT_SEGMENT} />
      </div>
    </OperatorPageContainer>
  );
}
