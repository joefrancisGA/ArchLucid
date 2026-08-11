import { describe, expect, it } from "vitest";

import {
  DPA_TEMPLATE_HELP_CANONICAL_PATH,
  DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE,
  DPA_TEMPLATE_HELP_DOWNLOAD_ACTION,
  DPA_TEMPLATE_HELP_KEY_TERMS,
  DPA_TEMPLATE_HELP_OPEN_VARIABLES,
  DPA_TEMPLATE_HELP_ORIENTATION,
  DPA_TEMPLATE_HELP_PRIMARY_ACTIONS,
  DPA_TEMPLATE_HELP_PROVENANCE,
  formatDpaTemplateHelpProvenanceLine,
} from "@/lib/dpa-template-help-guide-content";

describe("dpa-template-help-guide-content", () => {
  it("keeps diligence CTAs on Trust Center, subprocessors, and procurement", () => {
    expect(DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openTrustCenter.href).toBe("/trust");
    expect(DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openSubprocessors.href).toBe("/help/subprocessors");
    expect(DPA_TEMPLATE_HELP_PRIMARY_ACTIONS.openProcurement.href).toBe("/help/procurement");
  });

  it("names the PDF download action for counsel handoff", () => {
    expect(DPA_TEMPLATE_HELP_DOWNLOAD_ACTION.label.toLowerCase()).toContain("download dpa template");
    expect(DPA_TEMPLATE_HELP_DOWNLOAD_ACTION.label.toLowerCase()).toContain("pdf");
  });

  it("lists orientation steps without architecture-runs jargon", () => {
    expect(DPA_TEMPLATE_HELP_ORIENTATION).toHaveLength(3);
    expect(DPA_TEMPLATE_HELP_ORIENTATION.join(" ").toLowerCase()).not.toContain("architecture runs");
    expect(DPA_TEMPLATE_HELP_ORIENTATION[2]?.toLowerCase()).toContain("expand the full template");
    expect(DPA_TEMPLATE_HELP_ORIENTATION[2]?.toLowerCase()).not.toContain("only after counsel is ready");
  });

  it("surfaces material DPA terms and open negotiation variables from the source template", () => {
    const keyTermText = DPA_TEMPLATE_HELP_KEY_TERMS.map((term) => `${term.label} ${term.value}`).join(" ").toLowerCase();

    expect(keyTermText).toContain("90 days");
    expect(keyTermText).toContain("72 hours");
    expect(keyTermText).toContain("standard contractual clauses");
    expect(keyTermText).toContain("k >= 5");
    expect(keyTermText).toContain("soc 2");

    expect(DPA_TEMPLATE_HELP_OPEN_VARIABLES.length).toBeGreaterThanOrEqual(4);
    expect(DPA_TEMPLATE_HELP_OPEN_VARIABLES.join(" ")).toContain("<<Controller legal name and address>>");
    expect(DPA_TEMPLATE_HELP_OPEN_VARIABLES.join(" ")).toContain("<<Subscription or order form ID>>");
  });

  it("records template provenance without implying an executed agreement", () => {
    const provenanceLine = formatDpaTemplateHelpProvenanceLine();

    expect(DPA_TEMPLATE_HELP_PROVENANCE.templateReviewDate).toBe("2026-07-25");
    expect(DPA_TEMPLATE_HELP_PROVENANCE.sourceOfRecordPath).toBe("docs/go-to-market/DPA_TEMPLATE.md");
    expect(provenanceLine).toContain("2026-07-25");
    expect(provenanceLine).toContain("docs/go-to-market/DPA_TEMPLATE.md");
    expect(provenanceLine.toLowerCase()).toContain("no executed agreement");
    expect(provenanceLine).not.toContain(DPA_TEMPLATE_HELP_CANONICAL_PATH);
  });

  it("states claim discipline without implying certification or a signed DPA", () => {
    expect(DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("not a countersigned");
    expect(DPA_TEMPLATE_HELP_CLAIM_DISCIPLINE.toLowerCase()).toContain("cpa");
  });
});
