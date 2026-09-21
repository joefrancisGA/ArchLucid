import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION } from "@/lib/evidence-source-inspect-help-stored-evidence-guide-content";

/** Header actions for `/help/inspect-stored-evidence` (ESI-08 / EIN). */
export function HelpInspectStoredEvidenceHeaderActions(): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="help-inspect-stored-evidence-header-actions">
      <Button asChild data-testid={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION.testId} size="sm" variant="primary">
        <Link href={EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION.href}>
          {EVIDENCE_SOURCE_INSPECT_HELP_STORED_EVIDENCE_PRIMARY_ACTION.label}
        </Link>
      </Button>
    </div>
  );
}
