import { describe, expect, it } from "vitest";

import { buildInspectFindingWorkItemBody, buildTraceRowWorkItemBody } from "./copy-finding-as-work-item";

describe("buildInspectFindingWorkItemBody", () => {
  const inspectInput = {
    runId: "r1",
    findingId: "f1",
    siteOrigin: "https://demo.example.org",
    severityLabel: "Warning",
    categoryLabel: "Compliance",
    impactedAreaLabel: "Data egress",
    title: "Exposed egress",
    description: "Outbound path not restricted.",
    recommendedAction: "Add firewall rules.",
    decisionRuleId: "rule-x",
    decisionRuleName: "Egress audit",
    evidenceExcerpts: ["subnet-1 (lines 12-14)", "diagram.png"],
    trustLabel: "DeterministicRule",
    trustLabelReason: "Policy rule matched.",
  } as const;

  it("produces Markdown with links and headings", () => {
    const text = buildInspectFindingWorkItemBody("markdown", inspectInput);

    expect(text).toContain("## Finding: Compliance — Exposed egress");
    expect(text).toContain("`f1`");
    expect(text).toContain("`r1`");
    expect(text).toContain("- ArchLucid review: https://demo.example.org/architecture/reviews/r1");
    expect(text).toContain("- Finding (explain page): https://demo.example.org/architecture/reviews/r1/findings/f1");
    expect(text).toContain("**Trust label:** DeterministicRule — Policy rule matched.");
  });

  it("includes Working coverage honesty in Jira wiki exports (FC-41)", () => {
    const withHonesty = {
      ...inspectInput,
      coverageHonestyLine: "Checklist coverage stays on the package when the insight-density gate demotes a finding.",
      includeCoverageHonesty: true,
    };

    const text = buildInspectFindingWorkItemBody("jiraWiki", withHonesty);

    expect(text).toContain("*Coverage honesty:*");
    expect(text).toContain("insight-density gate demotes");
  });

  it("uses Jira wiki markers for Jira variant", () => {
    const text = buildInspectFindingWorkItemBody("jiraWiki", inspectInput);

    expect(text).toContain("h2. ArchLucid Finding");
    expect(text).toContain("|ArchLucid finding — explain page)");
    expect(text).toContain("*Trust label:* DeterministicRule — Policy rule matched.");
  });

  it("produces ServiceNow plain text with short description, steps, and footer ids", () => {
    const text = buildInspectFindingWorkItemBody("serviceNowText", inspectInput);

    expect(text).toContain("Short description: Compliance — Exposed egress (f1)");
    expect(text).toContain("Steps to resolve:");
    expect(text).toContain("ArchLucid inspector link: https://demo.example.org/architecture/reviews/r1/findings/f1/evidence-trace");
    expect(text).toContain("Finding ID: f1");
    expect(text).toContain("Run ID: r1");
    expect(text).toContain("Add firewall rules.");
    expect(text).toContain("Trust label: DeterministicRule — Policy rule matched.");
  });

  it("labels null inspect fields without inventing Not available or citation placeholders (P-01–P-05)", () => {
    const sparse = {
      runId: "r",
      findingId: "f",
      siteOrigin: "https://h.example.org",
      severityLabel: null,
      categoryLabel: null,
      impactedAreaLabel: null,
      title: null,
      description: null,
      recommendedAction: null,
      decisionRuleId: null,
      decisionRuleName: null,
      evidenceExcerpts: [],
    };

    const markdown = buildInspectFindingWorkItemBody("markdown", sparse);
    expect(markdown).toContain("Finding title was not stored.");
    expect(markdown).toContain("Business impact was not stored.");
    expect(markdown).toContain("**Severity:** Severity was not stored.");
    expect(markdown).toContain("Description was not stored.");
    expect(markdown).not.toContain("Not available");
    expect(markdown).not.toContain("ArchLucid finding");
    expect(markdown).toContain("Recommended action was not stored.");
    expect(markdown).toContain("Decision rule was not stored.");
    expect(markdown).toContain("Evidence excerpt was not stored.");
    expect(markdown).not.toContain("(citation)");

    const serviceNow = buildInspectFindingWorkItemBody("serviceNowText", sparse);
    expect(serviceNow).toContain("Severity: Severity was not stored.");
    expect(serviceNow).not.toContain("No recommended action recorded for this finding.");

    const json = JSON.parse(buildInspectFindingWorkItemBody("json", sparse)) as {
      severity: string;
      recommendedAction: string;
      ruleId: string;
    };
    expect(json.severity).toBe("Severity was not stored.");
    expect(json.recommendedAction).toBe("Recommended action was not stored.");
    expect(json.ruleId).toBe("Decision rule was not stored.");
  });

  it("labels decision rule by id when the rule name was not stored (P-10)", () => {
    const markdown = buildInspectFindingWorkItemBody("markdown", {
      ...inspectInput,
      decisionRuleName: null,
      decisionRuleId: "rule-42",
    });

    expect(markdown).toContain("**Decision rule:** Rule name was not stored. Rule id rule-42.");
  });

  it("preserves stored empty strings on work-item clipboard fields (P-01–P-04)", () => {
    const emptyStored = {
      runId: "r",
      findingId: "f",
      siteOrigin: "https://h.example.org",
      severityLabel: "",
      categoryLabel: null,
      impactedAreaLabel: null,
      title: null,
      description: "",
      recommendedAction: "",
      decisionRuleId: "",
      decisionRuleName: "",
      evidenceExcerpts: [" (lines 1-2)"],
    };

    const markdown = buildInspectFindingWorkItemBody("markdown", emptyStored);
    expect(markdown).toContain("**Severity:** ");
    expect(markdown).not.toContain("Severity was not stored.");
    expect(markdown).toContain("Description was stored empty.");
    expect(markdown).toContain("Recommended action was stored empty.");
    expect(markdown).toContain("**Decision rule:** ");
    expect(markdown).toContain("-  (lines 1-2)");
    expect(markdown).not.toContain("(citation)");
  });

  it("includes trust fields in JSON export", () => {
    const text = buildInspectFindingWorkItemBody("json", inspectInput);
    const parsed = JSON.parse(text) as { trustLabel: string; trustLabelReason: string };

    expect(parsed.trustLabel).toBe("DeterministicRule");
    expect(parsed.trustLabelReason).toBe("Policy rule matched.");
  });

  it("includes semantic support band fields in JSON export (AS-071)", () => {
    const text = buildInspectFindingWorkItemBody("json", {
      ...inspectInput,
      classification: "DecisionGradeFinding",
      semanticSupportBand: "Unsupported",
      semanticSupportBandScorerVersion: "as057-v1",
    });
    const parsed = JSON.parse(text) as {
      semanticSupportBand: string;
      semanticSupportBandScorerVersion: string;
    };

    expect(parsed.semanticSupportBand).toBe("Unsupported");
    expect(parsed.semanticSupportBandScorerVersion).toBe("as057-v1");
  });

  it("does not invent semantic support values when the wire fields are absent", () => {
    const text = buildInspectFindingWorkItemBody("json", {
      ...inspectInput,
      classification: null,
      semanticSupportBand: null,
      semanticSupportBandScorerVersion: null,
    });

    expect(text).not.toContain("DecisionGradeFinding");
    expect(text).not.toContain("NotScored");
    expect(text).not.toContain("as057-v1");
  });

  it("includes Working coverage honesty after severity in markdown exports (FD-07)", () => {
    const withHonesty = {
      ...inspectInput,
      coverageHonestyLine:
        "Checklist coverage stays on the package when the insight-density gate demotes a finding.",
      includeCoverageHonesty: true,
    };

    const text = buildInspectFindingWorkItemBody("markdown", withHonesty);

    expect(text.indexOf("**Severity:**")).toBeLessThan(text.indexOf("**Coverage honesty:**"));
    expect(text).toContain("insight-density gate demotes");
  });

  it("omits coverage honesty when includeCoverageHonesty is false", () => {
    const guidedPaste = {
      ...inspectInput,
      coverageHonestyLine:
        "Checklist coverage stays on the package when the insight-density gate demotes a finding.",
      includeCoverageHonesty: false,
    };

    const text = buildInspectFindingWorkItemBody("markdown", guidedPaste);

    expect(text).not.toContain("Coverage honesty");
  });

  it("uses SecureNow labels when productLineId is security", () => {
    const securityInput = { ...inspectInput, productLineId: "security" as const };
    const text = buildInspectFindingWorkItemBody("jiraWiki", securityInput);

    expect(text).toContain("h2. SecureNow Finding");
    expect(text).toContain("|SecureNow finding — explain page)");
    expect(text).not.toContain("ArchLucid Finding");
  });
});

describe("buildTraceRowWorkItemBody", () => {
  const traceInput = {
    runId: "run-z",
    findingId: "find-z",
    findingTitle: "Title z",
    severityLabel: "High",
    recommendedAction: "Restrict egress.",
    statusLabel: "Open",
    ruleId: "R1",
    siteOrigin: "https://demo.example.org",
  } as const;

  it("lists relative paths for stubs", () => {
    const text = buildTraceRowWorkItemBody("markdown", traceInput);

    expect(text).toContain("## Finding: Title z");
    expect(text).toContain("**Severity:** High");
    expect(text).toContain("Restrict egress.");
    expect(text).toContain("`find-z`");
    expect(text).toContain("https://demo.example.org/architecture/reviews/run-z/findings/find-z");
  });

  it("supports ServiceNow plain text for trace rows", () => {
    const text = buildTraceRowWorkItemBody("serviceNowText", traceInput);

    expect(text).toContain("Short description: Title z (find-z)");
    expect(text).toContain("Severity: High");
    expect(text).toContain("Restrict egress.");
    expect(text).toContain("ArchLucid inspector link:");
    expect(text).toContain("Finding ID: find-z");
  });

  it("includes skipped MUST coverage honesty in trace-row Jira wiki exports (FC-41)", () => {
    const text = buildTraceRowWorkItemBody("jiraWiki", {
      ...traceInput,
      includeCoverageHonesty: true,
      coverageHonestyLine: "Skipped required questions: drRpo.",
    });

    expect(text).toContain("*Coverage honesty:* Skipped required questions: drRpo.");
  });

  it("supports Jira wiki with severity and recommended action", () => {
    const text = buildTraceRowWorkItemBody("jiraWiki", traceInput);

    expect(text).toContain("h2. ArchLucid Finding — Title z");
    expect(text).toContain("*Severity:* High");
    expect(text).toContain("*Recommended action*");
    expect(text).toContain("Restrict egress.");
    expect(text).toContain("{{find-z}}");
  });

  it("emits stable JSON seam document", () => {
    const text = buildTraceRowWorkItemBody("json", traceInput);
    const parsed = JSON.parse(text) as { schema: string; findingId: string; links: { inspect: string } };

    expect(parsed.schema).toBe("archlucid.work-item.v1");
    expect(parsed.findingId).toBe("find-z");
    expect(parsed.links.inspect).toContain("/findings/find-z/evidence-trace");
  });

  it("includes trust label in markdown and JSON when provided", () => {
    const withTrust = {
      ...traceInput,
      trustLabel: "EvidenceBacked",
      trustLabelReason: "Agent cited evidence.",
    };

    const markdown = buildTraceRowWorkItemBody("markdown", withTrust);
    expect(markdown).toContain("**Trust label:** EvidenceBacked — Agent cited evidence.");

    const json = JSON.parse(buildTraceRowWorkItemBody("json", withTrust)) as {
      trustLabel: string;
      trustLabelReason: string;
    };
    expect(json.trustLabel).toBe("EvidenceBacked");
    expect(json.trustLabelReason).toBe("Agent cited evidence.");
  });

  it("uses SecureNow labels when productLineId is security", () => {
    const securityInput = { ...traceInput, productLineId: "security" as const };
    const text = buildTraceRowWorkItemBody("jiraWiki", securityInput);

    expect(text).toContain("h2. SecureNow Finding — Title z");
    expect(text).toContain("|SecureNow review)");
    expect(text).not.toContain("ArchLucid");
  });

  it("labels null trace-row clipboard fields with omission copy (P-10)", () => {
    const sparse = {
      runId: "r",
      findingId: "f",
      findingTitle: null,
      severityLabel: null,
      recommendedAction: null,
      statusLabel: null,
      ruleId: null,
      siteOrigin: "https://h.example.org",
    };

    const markdown = buildTraceRowWorkItemBody("markdown", sparse);

    expect(markdown).toContain("## Finding: Finding title was not stored.");
    expect(markdown).toContain("**Severity:** Severity was not stored.");
    expect(markdown).toContain("Recommended action was not stored.");
    expect(markdown).not.toContain("Not available");
    expect(markdown).not.toContain("No recommended action recorded");
  });
});
