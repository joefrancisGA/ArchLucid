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
    expect(text).toContain("- ArchLucid run: https://demo.example.org/architecture/reviews/r1");
    expect(text).toContain("- Finding (explain page): https://demo.example.org/architecture/reviews/r1/findings/f1");
    expect(text).toContain("**Trust label:** DeterministicRule — Policy rule matched.");
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

  it("shows Not available sections when sparse", () => {
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

    const text = buildInspectFindingWorkItemBody("markdown", sparse);
    expect(text.includes("What was flagged")).toBe(true);
    expect(text.includes("Not available")).toBe(true);
  });

  it("includes trust fields in JSON export", () => {
    const text = buildInspectFindingWorkItemBody("json", inspectInput);
    const parsed = JSON.parse(text) as { trustLabel: string; trustLabelReason: string };

    expect(parsed.trustLabel).toBe("DeterministicRule");
    expect(parsed.trustLabelReason).toBe("Policy rule matched.");
  });

  it("includes Working coverage honesty after severity in markdown exports (FD-07)", () => {
    const withHonesty = {
      ...inspectInput,
      coverageHonestyLine:
        "Typed-engine findings stay on the package regardless of insight-density score (typed-engine-protected).",
      includeCoverageHonesty: true,
    };

    const text = buildInspectFindingWorkItemBody("markdown", withHonesty);

    expect(text.indexOf("**Severity:**")).toBeLessThan(text.indexOf("**Coverage honesty:**"));
    expect(text).toContain("typed-engine-protected");
  });

  it("omits coverage honesty when includeCoverageHonesty is false", () => {
    const guidedPaste = {
      ...inspectInput,
      coverageHonestyLine:
        "Typed-engine findings stay on the package regardless of insight-density score (typed-engine-protected).",
      includeCoverageHonesty: false,
    };

    const text = buildInspectFindingWorkItemBody("markdown", guidedPaste);

    expect(text).not.toContain("Coverage honesty");
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

    expect(text).toContain("Short description: ArchLucid finding — Title z (find-z)");
    expect(text).toContain("Severity: High");
    expect(text).toContain("Restrict egress.");
    expect(text).toContain("ArchLucid inspector link:");
    expect(text).toContain("Finding ID: find-z");
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
});
