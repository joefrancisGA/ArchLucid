import { describe, expect, it } from "vitest";

import {
  operatorSafeWorkspaceAiUnavailableDetail,
  workspaceAiUnavailableDetail,
} from "./workspace-ai-availability";

const unavailableResult = {
  isAvailable: false,
  validated: true,
  aiSource: "managed-platform",
  summary: "ArchLucid-managed AI is unavailable — reviews cannot start until platform AI is restored.",
  asOfUtc: "2026-08-31T18:00:00.000Z",
  checks: [],
  debug: {},
} as const;

describe("workspace AI availability product copy", () => {
  it("uses SecureNow for managed AI failures", () => {
    expect(workspaceAiUnavailableDetail(unavailableResult, "security")).toBe(
      "SecureNow-managed AI is unavailable — reviews cannot start until platform AI is restored.",
    );
  });

  it("preserves SecureNow branding through operator-safe copy", () => {
    expect(operatorSafeWorkspaceAiUnavailableDetail(unavailableResult, "security")).toContain("SecureNow-managed AI");
  });
});
