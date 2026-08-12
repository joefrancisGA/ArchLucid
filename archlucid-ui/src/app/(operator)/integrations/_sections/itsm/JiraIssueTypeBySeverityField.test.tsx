import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JiraIssueTypeBySeverityField } from "./JiraIssueTypeBySeverityField";

describe("JiraIssueTypeBySeverityField (TB-1149)", () => {
  it("renders structured severity rows and serializes edits to JSON", () => {
    const onChange = vi.fn();

    render(
      <JiraIssueTypeBySeverityField
        value='{"Critical":"Bug","Warning":"Task"}'
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId("jira-issue-type-by-severity-critical")).toHaveValue("Bug");
    expect(screen.getByTestId("jira-issue-type-by-severity-warning")).toHaveValue("Task");
    expect(screen.queryByPlaceholderText('{"Critical":"Bug","Warning":"Task"}')).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("jira-issue-type-by-severity-error"), {
      target: { value: "Incident" },
    });

    expect(onChange).toHaveBeenCalledWith('{"Critical":"Bug","Error":"Incident","Warning":"Task"}');
  });

  it("exposes advanced JSON editing in a disclosure", () => {
    render(<JiraIssueTypeBySeverityField value="" onChange={vi.fn()} />);

    expect(screen.getByTestId("jira-issue-type-by-severity-json-advanced")).toBeInTheDocument();
    expect(screen.getByText("Edit as JSON")).toBeInTheDocument();
  });
});
