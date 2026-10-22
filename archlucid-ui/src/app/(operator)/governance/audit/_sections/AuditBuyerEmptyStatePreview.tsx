import { cn } from "@/lib/utils";
import {
  AUDIT_TRAIL_EMPTY_PREVIEW_COLUMNS,
  AUDIT_TRAIL_EMPTY_PREVIEW_SECTION_TITLE,
} from "@/lib/audit-trail-page-copy";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

/** Muted preview of populated audit table columns for the empty state. */
export function AuditBuyerEmptyStatePreview(): React.JSX.Element {
  return (
    <section aria-labelledby="audit-empty-preview-heading" data-testid="audit-buyer-empty-preview">
      <h2 id="audit-empty-preview-heading" className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>
        {AUDIT_TRAIL_EMPTY_PREVIEW_SECTION_TITLE}
      </h2>
      <div className="mt-3 overflow-hidden rounded-md border border-neutral-200/80 dark:border-neutral-800/80">
        <div className="grid grid-cols-2 gap-px bg-neutral-200/80 dark:bg-neutral-800/80 sm:grid-cols-3 lg:grid-cols-6">
          {AUDIT_TRAIL_EMPTY_PREVIEW_COLUMNS.map((column) => (
            <div key={column} className="bg-neutral-50/80 px-2 py-2 dark:bg-neutral-950/60">
              <p className={cn("m-0 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>{column}</p>
              <p className={cn("m-0 mt-1 text-al-text-secondary/60", OPERATOR_TYPOGRAPHY.helper)}>—</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
