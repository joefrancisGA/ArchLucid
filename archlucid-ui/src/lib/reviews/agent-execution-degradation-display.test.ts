import { describe, expect, it } from "vitest";

import {
  AGENT_EXECUTION_LIMITATION_CODE_NOT_STORED_LABEL,
  AGENT_EXECUTION_LIMITATION_CODE_STORED_EMPTY_LABEL,
  formatAgentExecutionLimitationCodeLabel,
  formatAgentExecutionLimitationSuffix,
} from "./agent-execution-degradation-display";

describe("agent-execution-degradation-display", () => {
  it("distinguishes omitted and stored-empty limitation codes", () => {
    expect(formatAgentExecutionLimitationCodeLabel(null)).toBe(
      AGENT_EXECUTION_LIMITATION_CODE_NOT_STORED_LABEL,
    );
    expect(formatAgentExecutionLimitationCodeLabel("  ")).toBe(
      AGENT_EXECUTION_LIMITATION_CODE_STORED_EMPTY_LABEL,
    );
    expect(formatAgentExecutionLimitationCodeLabel("timeout")).toBe("timeout");
  });

  it("formats limitation suffix for outcome rows", () => {
    expect(formatAgentExecutionLimitationSuffix(undefined)).toBe("");
    expect(formatAgentExecutionLimitationSuffix("")).toBe(
      ` · ${AGENT_EXECUTION_LIMITATION_CODE_STORED_EMPTY_LABEL}`,
    );
    expect(formatAgentExecutionLimitationSuffix("budget_cap")).toBe(" · Limitation code budget_cap");
  });
});
