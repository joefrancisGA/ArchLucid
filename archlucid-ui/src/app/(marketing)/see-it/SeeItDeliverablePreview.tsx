import Link from "next/link";

import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  CUSTOMER_INTAKE_BUYER_REVIEW_PACKAGE_TITLE,
  CUSTOMER_INTAKE_PRIMARY_FINDING_TITLE,
} from "@/lib/samples/customer-intake-modernization/definition";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";
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
 * Static deliverable stack for the `/see-it` hero — fills the empty marketing rail
 * with a show-don't-tell preview of the proof package (links to the primary showcase).
 */
export function SeeItDeliverablePreview(): React.JSX.Element {
  return (
    <Link
      href={CANONICAL_ANONYMOUS_PROOF_HREF}
      className={cn(
        "group block rounded-lg border border-neutral-200 bg-al-surface-raised text-left shadow-sm transition-shadow hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
        "dark:border-neutral-700 dark:bg-neutral-900",
        MARKETING_MOTION.heroVisual,
      )}
      data-testid="see-it-deliverable-preview"
      aria-label="Open interactive sample review — preview of deliverables in the enterprise customer intake package"
    >
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
            {CUSTOMER_INTAKE_BUYER_REVIEW_PACKAGE_TITLE}
          </p>
          <StatusTag kind="approved" className="px-2.5 py-1 text-sm font-semibold" />
        </div>
        <p className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
          Sealed review record · Policy pack · Fabricated sample data
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

        <ul className="m-0 list-none space-y-1.5 p-0" aria-label="Package deliverable previews">
          {PREVIEW_LAYERS.map((layer) => (
            <li
              key={layer.id}
              className={cn(
                "rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/60",
              )}
            >
              <p className={cn("m-0 font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.meta)}>
                {layer.title}
              </p>
              <p className={cn("m-0 mt-0.5 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                {layer.detail}
              </p>
            </li>
          ))}
        </ul>

        <p
          className={cn("m-0 text-center", MARKETING_SURFACES.inlineLink, MARKETING_TYPOGRAPHY.meta)}
        >
          Open interactive sample review →
        </p>
      </div>
    </Link>
  );
}
