import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { MARKETING_MOTION, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  CUSTOMER_INTAKE_BUYER_REVIEW_PACKAGE_TITLE,
  CUSTOMER_INTAKE_PRIMARY_FINDING_TITLE,
} from "@/lib/samples/customer-intake-modernization/definition";
import { cn } from "@/lib/utils";

const PREVIEW_LAYERS = [
  {
    id: "sponsor-report",
    title: "Sponsor report",
    detail: "Sponsor briefing · sealed review record",
  },
  {
    id: "findings",
    title: "Findings",
    detail: "Evidence-linked risks with policy citations",
  },
  {
    id: "evidence-graph",
    title: "Evidence graph",
    detail: "Trace from claim → finding → stored evidence",
  },
  {
    id: "decision-record",
    title: "Decision record",
    detail: "Architecture decisions ready for handoff",
  },
  {
    id: "audit-trail",
    title: "Audit trail",
    detail: "Who acted, when, and what was committed",
  },
] as const;

/**
 * Static deliverable stack for marketing heroes — visual preview only (primary CTA lives in hero).
 */
export function SeeItDeliverablePreview(): React.JSX.Element {
  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-al-surface-raised text-left shadow-sm",
        "dark:border-neutral-700 dark:bg-neutral-900",
        MARKETING_MOTION.heroVisual,
      )}
      data-testid="see-it-deliverable-preview"
      aria-label="Sample deliverable preview for the enterprise customer intake package"
    >
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
            {CUSTOMER_INTAKE_BUYER_REVIEW_PACKAGE_TITLE}
          </p>
          <StatusTag
            kind="draft"
            label="Sample data"
            className="px-2.5 py-1 text-sm font-semibold"
            data-testid="see-it-preview-sample-tag"
          />
        </div>
        <p className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          Sealed review record · Policy pack · Enterprise customer intake sample
        </p>
      </div>

      <div className="space-y-2 px-4 py-4">
        <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityTag severity="high" />
            <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
              {CUSTOMER_INTAKE_PRIMARY_FINDING_TITLE}
            </p>
          </div>
          <p className={cn("m-0 mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Intake attachments may retain sensitive fields longer than the declared minimization policy allows.
          </p>
        </div>

        <ul className="m-0 list-none space-y-1 p-0" aria-label="Package deliverable previews">
          {PREVIEW_LAYERS.map((layer) => (
            <li key={layer.id} className="border-t border-neutral-200/80 pt-2 first:border-t-0 first:pt-0 dark:border-neutral-800/80">
              <p className={cn("m-0 font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.meta)}>{layer.title}</p>
              <p className={cn("m-0 mt-0.5 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>{layer.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
