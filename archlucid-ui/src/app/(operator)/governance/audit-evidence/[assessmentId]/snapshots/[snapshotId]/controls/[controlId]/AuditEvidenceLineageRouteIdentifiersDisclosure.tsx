import { CollapsibleSection } from "@/components/CollapsibleSection";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AUDIT_EVIDENCE_CONTROL_LINEAGE_IDENTIFIERS_TITLE } from "@/lib/audit-evidence-page-copy";
import { cn } from "@/lib/utils";

type AuditEvidenceLineageRouteIdentifiersDisclosureProps = {
  readonly assessmentId: string;
  readonly snapshotId: string;
  readonly controlId: string;
};

/** Progressive disclosure for route UUIDs on control lineage (GOO). */
export function AuditEvidenceLineageRouteIdentifiersDisclosure(
  props: AuditEvidenceLineageRouteIdentifiersDisclosureProps,
): React.JSX.Element {
  return (
    <CollapsibleSection
      title={AUDIT_EVIDENCE_CONTROL_LINEAGE_IDENTIFIERS_TITLE}
      sectionTestId="audit-evidence-lineage-route-identifiers"
      summaryLine="Assessment, snapshot, and control IDs from the URL"
    >
      <dl className="m-0 grid gap-2">
        <div>
          <dt className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.helper)}>Assessment ID</dt>
          <dd className={cn("m-0 mt-1 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {props.assessmentId}
          </dd>
        </div>
        <div>
          <dt className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.helper)}>Snapshot ID</dt>
          <dd className={cn("m-0 mt-1 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {props.snapshotId}
          </dd>
        </div>
        <div>
          <dt className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.helper)}>Control ID</dt>
          <dd className={cn("m-0 mt-1 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {props.controlId}
          </dd>
        </div>
      </dl>
    </CollapsibleSection>
  );
}
