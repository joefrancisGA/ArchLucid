import { describe, expect, it } from "vitest";

import {
  BUYER_EXECUTIVE_SCORECARD_COMMITTED_LABEL,
  BUYER_VALUE_REPORT_PAGE_SUBTITLE,
  SPONSOR_REPORT_PAGE_TITLE,
  OPERATOR_GRAPH_PAGE_SUBTITLE,
  PILOT_COMMAND_CENTER_CONNECT_AZURE,
  PILOT_COMMAND_CENTER_LEAD,
  PILOT_COMMAND_CENTER_OUTCOMES,
  PILOT_COMMAND_CENTER_OUTCOMES_HEADING,
  PRODUCT_CONCEPTS_GLOSSARY_DIALOG_DESCRIPTION,
  BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE,
  BUYER_HOME_START_CTO_DEMO_ARIA,
  BUYER_HOME_START_CTO_DEMO_CTA,
  BUYER_HOME_START_CTO_DEMO_HEADING,
  BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE,
  SAMPLE_REVIEW_AHA_DEMO_LABEL,
  OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER,
  BUYER_SIMULATOR_TRUST_BADGE_LABEL,
  BUYER_SIMULATOR_TRUST_BADGE_TOOLTIP,
  BUYER_SCOPE_LIST_UNAVAILABLE,
  BUYER_CTO_DEMO_LATENCY_EXCEEDED,
} from "@/lib/buyer/buyer-polish-copy";
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
  it("uses finalized review in operator graph page subtitle", () => {
    expect(OPERATOR_GRAPH_PAGE_SUBTITLE).toContain("finalized review");
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
  it("uses the merged sponsor report title and sponsor-ready subtitle", () => {
    expect(SPONSOR_REPORT_PAGE_TITLE).toBe("Sponsor report");
    expect(BUYER_VALUE_REPORT_PAGE_SUBTITLE).toContain("sponsor-ready");
    expect(SPONSOR_REPORT_PAGE_TITLE.toLowerCase()).not.toContain("pilot");
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
      "Aggregated proof from the evidence pack service — paired with the example Retail baseline review below.",
    );
    expect(BUYER_WHY_ARCHLUCID_SPONSOR_PACK_SOURCE_LINE.toLowerCase()).not.toMatch(/\bseed(ed)?\b/);
  });
});

describe("buyer-polish-copy operator home example review card (TB-471)", () => {
  it("uses Open example review heading and CTA without CTO demo framing", () => {
    expect(BUYER_HOME_START_CTO_DEMO_HEADING).toBe("Open example review");
    expect(BUYER_HOME_START_CTO_DEMO_CTA).toBe("Open example review");
    expect(BUYER_HOME_START_CTO_DEMO_ARIA).toBe("Open example review — sample review walkthrough");
    expect(BUYER_HOME_START_CTO_DEMO_HEADING.toLowerCase()).not.toContain("cto demo");
    expect(BUYER_HOME_START_CTO_DEMO_CTA.toLowerCase()).not.toContain("cto demo");
  });
});

describe("buyer-polish-copy governance preview note (TB-509)", () => {
  it("uses production framing with example review and no pilot or demo jargon", () => {
    expect(BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE).toBe(
      "In production, an architect with Execute authority approves here. This view shows the post-approval state from the example review.",
    );
    expect(BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE.toLowerCase()).not.toContain("live pilot");
    expect(BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE.toLowerCase()).not.toContain("demonstration purposes");
    expect(BUYER_CTO_DEMO_GOVERNANCE_PREVIEW_NOTE.toLowerCase()).not.toContain("connected workspace");
  });
});

describe("buyer-polish-copy sample review AHA badge (TB-473)", () => {
  it("uses Example review label without demo-derived framing", () => {
    expect(SAMPLE_REVIEW_AHA_DEMO_LABEL).toBe("Example review");
    expect(SAMPLE_REVIEW_AHA_DEMO_LABEL.toLowerCase()).not.toContain("demo-derived");
  });
});

describe("buyer-polish-copy sample findings defensible layer (TB-474)", () => {
  it("uses example review caption without demo-derived or execution mode jargon", () => {
    expect(OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER).toBe(
      "Example review — not your workspace data. Open the full review for findings, evidence, and the signed record.",
    );
    expect(OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER.toLowerCase()).not.toContain("demo-derived");
    expect(OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER.toLowerCase()).not.toContain("execution mode");
    expect(OPERATOR_HOME_SAMPLE_FINDINGS_DEFENSIBLE_LAYER.toLowerCase()).not.toContain("evidence basis");
  });
});

describe("buyer-polish-copy demo latency exceeded (TB-480)", () => {
  it("uses example review fallback without seeded showcase jargon", () => {
    expect(BUYER_CTO_DEMO_LATENCY_EXCEEDED).toBe(
      "Taking longer than expected — switch to example review.",
    );
    expect(BUYER_CTO_DEMO_LATENCY_EXCEEDED.toLowerCase()).not.toMatch(/\bseed(ed)?\b/);
    expect(BUYER_CTO_DEMO_LATENCY_EXCEEDED.toLowerCase()).not.toContain("showcase");
  });
});

describe("buyer-polish-copy scope list unavailable (TB-479)", () => {
  it("uses session framing without demonstration or demo jargon", () => {
    expect(BUYER_SCOPE_LIST_UNAVAILABLE).toBe(
      "Workspace directory is unavailable in this environment. The sample workspace remains active for this session.",
    );
    expect(BUYER_SCOPE_LIST_UNAVAILABLE.toLowerCase()).not.toContain("demonstration");
    expect(BUYER_SCOPE_LIST_UNAVAILABLE.toLowerCase()).not.toContain("demo");
  });
});

describe("buyer-polish-copy simulator trust badge (TB-475)", () => {
  it("uses Rule-based analysis label without Simulator mode in badge copy", () => {
    expect(BUYER_SIMULATOR_TRUST_BADGE_LABEL).toContain("Rule-based analysis");
    expect(BUYER_SIMULATOR_TRUST_BADGE_LABEL.toLowerCase()).not.toContain("simulator mode");
  });

  it("keeps full technical explanation in tooltip", () => {
    expect(BUYER_SIMULATOR_TRUST_BADGE_TOOLTIP.toLowerCase()).toContain("simulator mode");
    expect(BUYER_SIMULATOR_TRUST_BADGE_TOOLTIP).toContain("rule-based inference");
  });
});
