import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import type { FirstPilotReadinessRow } from "@/lib/first-pilot-readiness-cockpit";
import {
  READINESS_AZURE_EXTRACTOR_CTA,
  READINESS_CLOUD_EVIDENCE_LABEL,
} from "@/lib/onboarding-secondary-surfaces";
import {
  FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,
} from "@/lib/first-pilot-diagnostics-copy";
import { isBuyerShellHomePresentation } from "@/lib/buyer/buyer-shell-home-present";

type ReadinessRowPresentation = Pick<FirstPilotReadinessRow, "label" | "cta">;

const EXECUTIVE_READINESS_ROW_PRESENT: Readonly<Record<string, ReadinessRowPresentation>> = {
  "api-ready": { label: "API and platform readiness", cta: "View status" },
  "config-lint": { label: "Production-like configuration", cta: "View configuration" },
  "storage-and-sql": { label: "SQL/storage configured", cta: "Check readiness" },
  "principal-authority": { label: "Review authority", cta: "View permissions" },
  "review-pipeline": { label: "Create, execute, and finalize review", cta: "Open review" },
  "sample-review": { label: "Example review: ready", cta: "Open example" },
  "azure-extractor": { label: READINESS_CLOUD_EVIDENCE_LABEL, cta: READINESS_AZURE_EXTRACTOR_CTA },
  "roi-baselines": { label: "ROI assumptions", cta: "Add ROI assumptions" },
  "procurement-classification": { label: "Procurement bundle", cta: "Generate export" },
  "sponsor-packet": { label: "Executive evidence bundle", cta: "Open review" },
  "proof-pipeline": { label: "Pilot evidence bundle", cta: "View pilot guide" },
  "data-consistency": { label: "Readiness status", cta: "View status" },
  "second-review": { label: "Next recommended review", cta: CREATE_ARCHITECTURE_LABEL },
};

const OPERATOR_READINESS_ROW_CTA: Readonly<Partial<Record<string, string>>> = {
  "api-ready": FIRST_PILOT_READINESS_SYSTEM_STATUS_CTA,
  "config-lint": "Open config lint",
  "principal-authority": "Open roles",
  "review-pipeline": "Open latest review",
  "azure-extractor": READINESS_AZURE_EXTRACTOR_CTA,
  "roi-baselines": "Add ROI assumptions",
  "sponsor-packet": "Open evidence bundle",
  "proof-pipeline": "Open pilot guide",
  "second-review": "Start second review",
};

/** Applies executive labels and governed CTAs on the home readiness tables. */
export function applyHomeReadinessRowPresentation(rows: readonly FirstPilotReadinessRow[]): FirstPilotReadinessRow[] {
  const curated = isBuyerShellHomePresentation();

  return rows.map((row) => {
    const executive = EXECUTIVE_READINESS_ROW_PRESENT[row.id];

    if (executive === undefined) {
      return row;
    }

    if (curated) {
      return {
        ...row,
        label: executive.label,
        cta: executive.cta,
      };
    }

    const operatorCta = OPERATOR_READINESS_ROW_CTA[row.id];

    return {
      ...row,
      label: executive.label,
      cta: operatorCta ?? row.cta,
    };
  });
}
