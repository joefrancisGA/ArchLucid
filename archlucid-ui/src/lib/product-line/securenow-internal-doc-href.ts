import { resolveInAppDocHref } from "@/lib/in-app-doc-href";

/**
 * Internal SecureNow markdown under `docs/securenow/` maps to bounded operator surfaces.
 * Fallback `/help` is not unique enough for Home and link lists that key rows by `href`.
 */
const SECURENOW_INTERNAL_DOC_TO_OPERATOR_HREF: Readonly<Record<string, string>> = {
  "control_evidence_responsibility.md":
    "/administration/securenow-compliance-notes#control-evidence-responsibility",
  "decision_cycle_log.md":
    "/administration/securenow-pilot-decision#securenow-decision-cycle",
  "executive_packet_fill_guide.md":
    "/administration/securenow-sponsor-path#executive-packet-fill-guide",
  "framework_coverage.md": "/administration/securenow-compliance-notes#framework-coverage",
  "order_form_template.md": "/administration/securenow-quote-packet#order-form-template",
  "pilot_measurement_log.md":
    "/administration/securenow-investigation-effort#pilot-measurement-log",
  "quote_cover.md": "/administration/securenow-quote-packet#quote-cover",
  "quote_to_pilot_checklist.md":
    "/administration/securenow-quote-packet#quote-to-pilot-checklist",
  "roi_cost_input.md": "/administration/securenow-investigation-effort#roi-cost-input",
  "roi_fixture_worksheet.md":
    "/administration/securenow-investigation-effort#roi-fixture-worksheet",
  "roi_send_rule.md": "/administration/securenow-investigation-effort#roi-send-rule",
  "sku_meter_card.md": "/administration/securenow-quote-packet#sku-meter-card",
  "sponsor_readout_outline.md":
    "/administration/securenow-sponsor-path#sponsor-readout-outline",
  "procurement_index.md": "/administration/securenow-reviewer-packet#procurement-index",
  "controlled_pilot_proposal.md": "/administration/securenow-reviewer-packet#controlled-pilot-proposal",
};

/** Resolve SecureNow internal markdown under `docs/securenow/` to an in-app operator href. */
export function securenowInternalDocHref(fileName: string): string {
  const baseName = fileName.trim().replace(/^\/+/, "");
  const mapped = SECURENOW_INTERNAL_DOC_TO_OPERATOR_HREF[baseName.toLowerCase()];

  if (mapped !== undefined) {
    return mapped;
  }

  return resolveInAppDocHref(`docs/securenow/${baseName}`);
}

export const SECURENOW_INTERNAL_DOC_OPERATOR_HREFS = SECURENOW_INTERNAL_DOC_TO_OPERATOR_HREF;
