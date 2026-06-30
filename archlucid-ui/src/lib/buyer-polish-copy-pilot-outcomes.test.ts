import { describe, expect, it } from "vitest";

import {
  BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL,
  BUYER_VALUE_REPORT_PAGE_SUBTITLE,
  BUYER_VALUE_REPORT_PAGE_TITLE,
  OPERATOR_GRAPH_PAGE_SUBTITLE,
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_LEAD,
  PILOT_COMMAND_CENTER_OUTCOMES,
  PILOT_COMMAND_CENTER_OUTCOMES_HEADING,
  PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION,
  BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE,
} from "@/lib/buyer-polish-copy";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

/** TB-351: hero outcomes use discovery framing — not artifact receipt bullets. */
describe("buyer-polish-copy pilot command center outcomes (TB-351)", () => {
  it("uses discovery heading and V1-defensible value outcomes", () => {
    expect(PILOT_COMMAND_CENTER_OUTCOMES_HEADING).toBe("What ArchLucid discovers");
    expect(PILOT_COMMAND_CENTER_OUTCOMES).toEqual([
      "Missing dependencies",
      "Hidden risks",
      "Cost drivers",
      "Governance gaps",
      "Evidence gaps",
      "Decision impact",
    ]);
  });

  it("does not regress to artifact receipt framing", () => {
    const joined = PILOT_COMMAND_CENTER_OUTCOMES.join(" ");

    expect(PILOT_COMMAND_CENTER_OUTCOMES_HEADING).not.toBe("What you'll get");
    expect(joined).not.toMatch(/Review trail|Governed decision record|^Findings$|^Decisions$/);
  });
});

describe("buyer-polish-copy executive scorecard (TB-462)", () => {
  it("uses finalized reviews label on scorecard KPI", () => {
    expect(BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL).toBe("Finalized reviews");
    expect(BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL.toLowerCase()).not.toContain("committed");
  });
});

describe("buyer-polish-copy evidence graph subtitle (TB-464)", () => {
  it("uses finalized review package in operator graph page subtitle", () => {
    expect(OPERATOR_GRAPH_PAGE_SUBTITLE).toContain("finalized review package");
    expect(OPERATOR_GRAPH_PAGE_SUBTITLE.toLowerCase()).not.toContain("committed");
  });
});

describe("buyer-polish-copy home hero lead (TB-465)", () => {
  it("uses multi-cloud connection language without naming Azure", () => {
    expect(PILOT_COMMAND_CENTER_LEAD).toContain("optional cloud connection");
    expect(PILOT_COMMAND_CENTER_LEAD.toLowerCase()).not.toContain("azure");
  });
});

describe("buyer-polish-copy optional setup CTA (TB-466)", () => {
  it("uses Connect cloud label without naming Azure", () => {
    expect(PILOT_COMMAND_CENTER_CONNECT_AZURE).toBe("Connect cloud");
    expect(PILOT_COMMAND_CENTER_CONNECT_AZURE.toLowerCase()).not.toContain("azure");
  });

  it("routes optional cloud connection CTA to integrations cloud connections", () => {
    expect(CLOUD_CONNECTIONS_PATH).toBe("/integrations/cloud-connections");
  });
});

describe("buyer-polish-copy value report page (TB-468)", () => {
  it("uses executive value report title and executive-ready subtitle", () => {
    expect(BUYER_VALUE_REPORT_PAGE_TITLE).toBe("Executive value report");
    expect(BUYER_VALUE_REPORT_PAGE_SUBTITLE).toContain("executive-ready report");
    expect(BUYER_VALUE_REPORT_PAGE_TITLE.toLowerCase()).not.toContain("sponsor");
    expect(BUYER_VALUE_REPORT_PAGE_SUBTITLE.toLowerCase()).not.toContain("sponsor-ready");
  });
});

describe("buyer-polish-copy product concepts glossary (TB-469)", () => {
  it("uses architecture review glossary description without pilot framing", () => {
    expect(PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION).toBe(
      "Short definitions for terms you will encounter in your architecture reviews — open on demand.",
    );
    expect(PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION.toLowerCase()).not.toContain("pilot");
  });
});

describe("buyer-polish-copy Why ArchLucid sponsor pack source (TB-470)", () => {
  it("uses example review attribution without seeded framing", () => {
    expect(BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE).toBe(
      "Aggregated proof from the evidence pack service — paired with the example Claims Intake review below.",
    );
    expect(BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE.toLowerCase()).not.toMatch(/\bseed(ed)?\b/);
  });
});
