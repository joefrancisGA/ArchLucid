import { describe, expect, it } from "vitest";

import { isAzureBoardsNativeCreateReady } from "./azure-boards-api";

describe("isAzureBoardsNativeCreateReady", () => {
  it("fails closed without configured project defaults and a successful last test", () => {
    expect(isAzureBoardsNativeCreateReady(null)).toBe(false);
    expect(isAzureBoardsNativeCreateReady({ isConfigured: false })).toBe(false);
    expect(isAzureBoardsNativeCreateReady({ isConfigured: true, projectName: "", defaultWorkItemType: "Task" })).toBe(false);
    expect(isAzureBoardsNativeCreateReady({ isConfigured: true, projectName: "Pilot", defaultWorkItemType: "" })).toBe(false);
    expect(
      isAzureBoardsNativeCreateReady({
        isConfigured: true,
        projectName: "Pilot",
        defaultWorkItemType: "Task",
      }),
    ).toBe(false);
  });

  it("is ready when settings exist and the last stored test succeeded", () => {
    expect(
      isAzureBoardsNativeCreateReady({
        isConfigured: true,
        projectName: "Pilot",
        defaultWorkItemType: "Task",
        lastConnectionTestUtc: "2026-08-13T12:00:00.000Z",
        lastConnectionTestSummary: "Azure Boards reachable (1 project(s) discovered).",
      }),
    ).toBe(true);
  });
});
