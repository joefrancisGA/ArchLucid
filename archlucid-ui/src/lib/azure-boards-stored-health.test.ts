import { describe, expect, it } from "vitest";

import {
  AZURE_BOARDS_STORED_HEALTH_HEALTHY,
  AZURE_BOARDS_STORED_HEALTH_NOT_CONFIGURED,
  AZURE_BOARDS_STORED_HEALTH_NOT_TESTED,
  AZURE_BOARDS_STORED_HEALTH_UNHEALTHY,
  interpretAzureBoardsLastConnectionTest,
  isAzureBoardsLastConnectionTestSuccessSummary,
  mapAzureBoardsHealthFromConnectionTest,
  mapAzureBoardsHealthFromSettings,
  mapAzureBoardsStoredHealth,
} from "./azure-boards-stored-health";

describe("azure-boards-stored-health", () => {
  it("treats blank last-test evidence as never tested", () => {
    expect(interpretAzureBoardsLastConnectionTest(null, null)).toBeNull();
    expect(interpretAzureBoardsLastConnectionTest("  ", "  ")).toBeNull();
    expect(isAzureBoardsLastConnectionTestSuccessSummary(null)).toBe(false);
    expect(isAzureBoardsLastConnectionTestSuccessSummary("   ")).toBe(false);
  });

  it("interprets reachable and succeed summaries as success", () => {
    expect(interpretAzureBoardsLastConnectionTest("2026-08-13T00:00:00Z", "Azure Boards reachable (1 project(s) discovered).")).toBe(true);
    expect(interpretAzureBoardsLastConnectionTest(null, "Connection check succeeded.")).toBe(true);
  });

  it("interprets other last-test copy as failure", () => {
    expect(interpretAzureBoardsLastConnectionTest("2026-08-13T00:00:00Z", "Azure Boards connection test failed.")).toBe(false);
  });

  it("maps not configured, not tested, healthy, and unhealthy stored health", () => {
    expect(mapAzureBoardsStoredHealth({ credentialsConfigured: false }).status).toBe(
      AZURE_BOARDS_STORED_HEALTH_NOT_CONFIGURED,
    );
    expect(mapAzureBoardsStoredHealth({ credentialsConfigured: true }).status).toBe(
      AZURE_BOARDS_STORED_HEALTH_NOT_TESTED,
    );
    expect(
      mapAzureBoardsHealthFromSettings(true, {
        lastConnectionTestUtc: "2026-08-13T00:00:00Z",
        lastConnectionTestSummary: "Azure Boards reachable (2 project(s) discovered).",
      }).status,
    ).toBe(AZURE_BOARDS_STORED_HEALTH_HEALTHY);
    expect(
      mapAzureBoardsStoredHealth({
        credentialsConfigured: true,
        lastConnectionTestUtc: "2026-08-13T00:00:00Z",
        lastConnectionTestSummary: "   ",
      }).summary,
    ).toBe("Azure Boards connection test failed.");
    expect(
      mapAzureBoardsStoredHealth({
        credentialsConfigured: true,
        lastConnectionTestUtc: "2026-08-13T00:00:00Z",
        lastConnectionTestSummary: "token denied",
      }).status,
    ).toBe(AZURE_BOARDS_STORED_HEALTH_UNHEALTHY);
  });

  it("maps a live test-connection response without a follow-up health GET", () => {
    expect(mapAzureBoardsHealthFromConnectionTest({ ok: true, summary: "Connection check succeeded." })).toEqual({
      status: AZURE_BOARDS_STORED_HEALTH_HEALTHY,
      reachable: true,
      summary: "Connection check succeeded.",
      statusCode: null,
    });
    expect(mapAzureBoardsHealthFromConnectionTest({ ok: false, statusCode: null })).toMatchObject({
      status: AZURE_BOARDS_STORED_HEALTH_NOT_CONFIGURED,
      reachable: false,
    });
    expect(mapAzureBoardsHealthFromConnectionTest({ ok: false, statusCode: 401, summary: "  " })).toMatchObject({
      status: AZURE_BOARDS_STORED_HEALTH_UNHEALTHY,
      reachable: false,
      statusCode: 401,
      summary: "Azure Boards connection test failed.",
    });
    expect(mapAzureBoardsHealthFromConnectionTest({ ok: true })).toMatchObject({
      summary: "Azure Boards reachable.",
    });
    expect(mapAzureBoardsHealthFromConnectionTest({ ok: false, statusCode: null, summary: "  " })).toMatchObject({
      summary: "Azure Boards connector credentials are not configured.",
    });
  });
});
