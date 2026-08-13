import { describe, expect, it } from "vitest";

import type { JiraConnectionStatus } from "@/lib/jira-integration-present";
import type { ServiceNowConnectionStatus } from "@/lib/servicenow-integration-present";

import {
  itsmConnectionStatusTagKind,
  type ItsmConnectionStatus,
} from "./itsm-connection-status-tag-kind";

const ITSM_CONNECTION_STATUSES: readonly ItsmConnectionStatus[] = [
  "connected",
  "setup-incomplete",
  "connection-issue",
  "testing",
  "not-available",
];

describe("itsmConnectionStatusTagKind", () => {
  it("maps every ITSM connection status to the expected StatusTag kind", () => {
    expect(itsmConnectionStatusTagKind("connected")).toBe("ready");
    expect(itsmConnectionStatusTagKind("setup-incomplete")).toBe("needs-attention");
    expect(itsmConnectionStatusTagKind("connection-issue")).toBe("needs-attention");
    expect(itsmConnectionStatusTagKind("testing")).toBe("in-progress");
    expect(itsmConnectionStatusTagKind("not-available")).toBe("neutral");
  });

  it("covers every declared ITSM connection status", () => {
    for (const status of ITSM_CONNECTION_STATUSES) {
      expect(itsmConnectionStatusTagKind(status)).toBeTruthy();
    }
  });

  it("maps ServiceNow and Jira connection statuses to identical tag kinds", () => {
    const jiraStatuses: readonly JiraConnectionStatus[] = [
      "connected",
      "setup-incomplete",
      "connection-issue",
      "testing",
      "not-available",
    ];
    const serviceNowStatuses: readonly ServiceNowConnectionStatus[] = [
      "connected",
      "setup-incomplete",
      "connection-issue",
      "testing",
      "not-available",
    ];

    for (const status of jiraStatuses) {
      const mapped: ItsmConnectionStatus = status;
      expect(itsmConnectionStatusTagKind(mapped)).toBe(itsmConnectionStatusTagKind(status));
    }

    for (const status of serviceNowStatuses) {
      const mapped: ItsmConnectionStatus = status;
      expect(itsmConnectionStatusTagKind(mapped)).toBe(itsmConnectionStatusTagKind(status));
    }
  });
});
