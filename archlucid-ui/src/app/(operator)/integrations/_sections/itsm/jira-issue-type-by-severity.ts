/** Canonical FindingSeverity names persisted in JiraIssueTypeBySeverityJson (TB-1149). */
export const JIRA_ISSUE_TYPE_BY_SEVERITY_LEVELS = [
  "Critical",
  "Error",
  "Warning",
  "Info",
] as const;

export type JiraIssueTypeBySeverityLevel = (typeof JIRA_ISSUE_TYPE_BY_SEVERITY_LEVELS)[number];

export type JiraIssueTypeBySeverityMap = Partial<Record<JiraIssueTypeBySeverityLevel, string>>;

export const JIRA_ISSUE_TYPE_BY_SEVERITY_JSON_MAX_LENGTH = 4000;

export function emptyJiraIssueTypeBySeverityMap(): JiraIssueTypeBySeverityMap {
  return {};
}

export function parseJiraIssueTypeBySeverityJson(
  json: string,
): { map: JiraIssueTypeBySeverityMap; error: string | null } {
  const trimmed = json.trim();

  if (trimmed.length === 0) {
    return { map: emptyJiraIssueTypeBySeverityMap(), error: null };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return { map: emptyJiraIssueTypeBySeverityMap(), error: "Issue type map must be valid JSON." };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      map: emptyJiraIssueTypeBySeverityMap(),
      error: "Issue type map must be a JSON object (severity name → issue type name).",
    };
  }

  const map: JiraIssueTypeBySeverityMap = {};

  for (const [rawKey, rawValue] of Object.entries(parsed as Record<string, unknown>)) {
    const key = rawKey.trim();
    const matchedLevel = JIRA_ISSUE_TYPE_BY_SEVERITY_LEVELS.find(
      (level) => level.toLowerCase() === key.toLowerCase(),
    );

    if (matchedLevel === undefined) {
      continue;
    }

    if (typeof rawValue !== "string") {
      return {
        map: emptyJiraIssueTypeBySeverityMap(),
        error: `Issue type for ${matchedLevel} must be text.`,
      };
    }

    const issueType = rawValue.trim();

    if (issueType.length > 0) {
      map[matchedLevel] = issueType;
    }
  }

  return { map, error: null };
}

export function serializeJiraIssueTypeBySeverityMap(map: JiraIssueTypeBySeverityMap): string {
  const payload: Record<string, string> = {};

  for (const level of JIRA_ISSUE_TYPE_BY_SEVERITY_LEVELS) {
    const issueType = map[level]?.trim();

    if (issueType !== undefined && issueType.length > 0) {
      payload[level] = issueType;
    }
  }

  return JSON.stringify(payload);
}

export function validateJiraIssueTypeBySeverityJson(json: string): string | null {
  const trimmed = json.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > JIRA_ISSUE_TYPE_BY_SEVERITY_JSON_MAX_LENGTH) {
    return `Issue type map must be at most ${JIRA_ISSUE_TYPE_BY_SEVERITY_JSON_MAX_LENGTH} characters.`;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return "Issue type map must be valid JSON.";
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return "Issue type map must be a JSON object (severity name → issue type name).";
  }

  for (const [rawKey, rawValue] of Object.entries(parsed as Record<string, unknown>)) {
    const key = rawKey.trim();
    const matchedLevel = JIRA_ISSUE_TYPE_BY_SEVERITY_LEVELS.find(
      (level) => level.toLowerCase() === key.toLowerCase(),
    );

    if (matchedLevel === undefined) {
      return `Unknown severity "${key}". Use Critical, Error, Warning, or Info.`;
    }

    if (typeof rawValue !== "string") {
      return `Issue type for ${matchedLevel} must be text.`;
    }
  }

  return null;
}
