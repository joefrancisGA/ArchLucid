"use client";

import { useEffect, useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import {
  JIRA_ISSUE_TYPE_BY_SEVERITY_LEVELS,
  parseJiraIssueTypeBySeverityJson,
  serializeJiraIssueTypeBySeverityMap,
  type JiraIssueTypeBySeverityLevel,
  type JiraIssueTypeBySeverityMap,
} from "./jira-issue-type-by-severity";

export type JiraIssueTypeBySeverityFieldProps = {
  readonly value: string;
  readonly onChange: (nextJson: string) => void;
  readonly disabled?: boolean;
};

export function JiraIssueTypeBySeverityField(props: JiraIssueTypeBySeverityFieldProps): React.ReactElement {
  const { value, onChange, disabled = false } = props;
  const baseId = useId();
  const [rows, setRows] = useState<JiraIssueTypeBySeverityMap>(() => parseJiraIssueTypeBySeverityJson(value).map);
  const [advancedJson, setAdvancedJson] = useState(value);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    const parsed = parseJiraIssueTypeBySeverityJson(value);

    if (parsed.error === null) {
      setRows(parsed.map);
      setAdvancedJson(value.trim().length > 0 ? value : serializeJiraIssueTypeBySeverityMap(parsed.map));
    }
  }, [value]);

  const updateRows = (level: JiraIssueTypeBySeverityLevel, issueType: string) => {
    const nextRows: JiraIssueTypeBySeverityMap = { ...rows, [level]: issueType };
    setRows(nextRows);
    onChange(serializeJiraIssueTypeBySeverityMap(nextRows));
  };

  const handleAdvancedToggle = (open: boolean) => {
    if (open) {
      const serialized = serializeJiraIssueTypeBySeverityMap(rows);
      setAdvancedJson(serialized === "{}" ? "" : serialized);
    } else {
      const parsed = parseJiraIssueTypeBySeverityJson(advancedJson);

      if (parsed.error !== null) {
        const serialized = serializeJiraIssueTypeBySeverityMap(rows);
        const normalizedJson = serialized === "{}" ? "" : serialized;
        setAdvancedJson(normalizedJson);
        onChange(normalizedJson);
      } else {
        const normalizedJson = serializeJiraIssueTypeBySeverityMap(parsed.map);
        setRows(parsed.map);
        onChange(normalizedJson === "{}" ? "" : normalizedJson);
      }
    }

    setAdvancedOpen(open);
  };

  return (
    <div className="space-y-3" data-testid="jira-issue-type-by-severity-field">
      <div className="space-y-1">
        <Label>Jira issue type by severity</Label>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Map each finding severity to a Jira issue type name in your project.
        </p>
      </div>

      <div className="space-y-3">
        {JIRA_ISSUE_TYPE_BY_SEVERITY_LEVELS.map((level) => (
          <div key={level} className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-center">
            <Label htmlFor={`${baseId}-${level}`} className="m-0 text-al-text-secondary">
              {level}
            </Label>
            <Input
              id={`${baseId}-${level}`}
              value={rows[level] ?? ""}
              onChange={(event) => updateRows(level, event.target.value)}
              disabled={disabled || advancedOpen}
              placeholder={level === "Critical" ? "Bug" : level === "Warning" ? "Task" : "Task"}
              autoComplete="off"
              data-testid={`jira-issue-type-by-severity-${level.toLowerCase()}`}
            />
          </div>
        ))}
      </div>

      <details
        open={advancedOpen}
        onToggle={(event) => handleAdvancedToggle(event.currentTarget.open)}
        data-testid="jira-issue-type-by-severity-json-advanced"
      >
        <summary className={cn("cursor-pointer select-none", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
          Edit as JSON
        </summary>
        <div className="mt-2 space-y-2">
          <Label htmlFor={`${baseId}-json`} className="sr-only">
            Jira issue type by severity JSON
          </Label>
          <Textarea
            id={`${baseId}-json`}
            value={advancedJson}
            onChange={(event) => {
              setAdvancedJson(event.target.value);
              onChange(event.target.value);
            }}
            disabled={disabled}
            rows={4}
            data-testid="jira-issue-type-by-severity-json"
          />
        </div>
      </details>
    </div>
  );
}
