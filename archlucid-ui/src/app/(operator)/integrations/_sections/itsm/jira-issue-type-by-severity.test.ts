import { describe, expect, it } from "vitest";

import {
  parseJiraIssueTypeBySeverityJson,
  serializeJiraIssueTypeBySeverityMap,
  validateJiraIssueTypeBySeverityJson,
} from "./jira-issue-type-by-severity";

describe("jira issue type by severity (TB-1149)", () => {
  it("round-trips structured rows through JSON", () => {
    const map = { Critical: "Bug", Warning: "Task" };
    const json = serializeJiraIssueTypeBySeverityMap(map);
    const parsed = parseJiraIssueTypeBySeverityJson(json);

    expect(parsed.error).toBeNull();
    expect(parsed.map).toEqual(map);
    expect(json).toBe('{"Critical":"Bug","Warning":"Task"}');
  });

  it("parses severity keys case-insensitively", () => {
    const parsed = parseJiraIssueTypeBySeverityJson('{"critical":"Bug","warning":"Task"}');

    expect(parsed.error).toBeNull();
    expect(parsed.map).toEqual({ Critical: "Bug", Warning: "Task" });
  });

  it("rejects non-object JSON", () => {
    expect(validateJiraIssueTypeBySeverityJson("[]")).toMatch(/JSON object/i);
  });

  it("rejects invalid JSON", () => {
    expect(validateJiraIssueTypeBySeverityJson("{not json")).toMatch(/valid JSON/i);
  });

  it("accepts empty map as cleared settings", () => {
    expect(validateJiraIssueTypeBySeverityJson("")).toBeNull();
    expect(validateJiraIssueTypeBySeverityJson("{}")).toBeNull();
  });

  it("rejects unknown severity keys", () => {
    expect(validateJiraIssueTypeBySeverityJson('{"High":"Bug"}')).toMatch(/Unknown severity/i);
  });
});
