import type {
  AzureBoardsConnectionTestResponse,
  AzureBoardsIntegrationHealthResponse,
  AzureBoardsOutboundSettingsResponse,
} from "@/lib/api/azure-boards-api";

export const AZURE_BOARDS_STORED_HEALTH_NOT_CONFIGURED = "not_configured";
export const AZURE_BOARDS_STORED_HEALTH_NOT_TESTED = "not_tested";
export const AZURE_BOARDS_STORED_HEALTH_HEALTHY = "healthy";
export const AZURE_BOARDS_STORED_HEALTH_UNHEALTHY = "unhealthy";

export type AzureBoardsStoredHealthInput = {
  readonly credentialsConfigured: boolean;
  readonly lastConnectionTestUtc?: string | null;
  readonly lastConnectionTestSummary?: string | null;
};

/** True when the persisted last-test summary is a successful probe or operator test. */
export function isAzureBoardsLastConnectionTestSuccessSummary(summary: string | null | undefined): boolean {
  if (summary === null || summary === undefined) {
    return false;
  }

  const lowered = summary.trim().toLowerCase();

  if (lowered.length === 0) {
    return false;
  }

  return lowered.includes("reachable") || lowered.includes("succeed");
}

/** null = never tested; true/false = last stored result. */
export function interpretAzureBoardsLastConnectionTest(
  lastTestUtc: string | null | undefined,
  lastTestSummary: string | null | undefined,
): boolean | null {
  const hasUtc = (lastTestUtc?.trim().length ?? 0) > 0;
  const hasSummary = (lastTestSummary?.trim().length ?? 0) > 0;

  if (!hasUtc && !hasSummary) {
    return null;
  }

  if (isAzureBoardsLastConnectionTestSuccessSummary(lastTestSummary)) {
    return true;
  }

  return false;
}

export function mapAzureBoardsStoredHealth(input: AzureBoardsStoredHealthInput): AzureBoardsIntegrationHealthResponse {
  const lastTestOk = interpretAzureBoardsLastConnectionTest(
    input.lastConnectionTestUtc,
    input.lastConnectionTestSummary,
  );
  const summary = input.lastConnectionTestSummary?.trim() ?? "";

  if (lastTestOk === true) {
    return {
      status: AZURE_BOARDS_STORED_HEALTH_HEALTHY,
      reachable: true,
      summary,
      statusCode: null,
    };
  }

  if (lastTestOk === false) {
    return {
      status: AZURE_BOARDS_STORED_HEALTH_UNHEALTHY,
      reachable: false,
      summary: summary.length > 0 ? summary : "Azure Boards connection test failed.",
      statusCode: null,
    };
  }

  if (!input.credentialsConfigured) {
    return {
      status: AZURE_BOARDS_STORED_HEALTH_NOT_CONFIGURED,
      reachable: false,
      summary: "Azure Boards connector credentials are not configured.",
      statusCode: null,
    };
  }

  return {
    status: AZURE_BOARDS_STORED_HEALTH_NOT_TESTED,
    reachable: false,
    summary: "Connection settings are saved but have not been validated yet.",
    statusCode: null,
  };
}

export function mapAzureBoardsHealthFromSettings(
  credentialsConfigured: boolean,
  settings: AzureBoardsOutboundSettingsResponse | null | undefined,
): AzureBoardsIntegrationHealthResponse {
  return mapAzureBoardsStoredHealth({
    credentialsConfigured,
    lastConnectionTestUtc: settings?.lastConnectionTestUtc,
    lastConnectionTestSummary: settings?.lastConnectionTestSummary,
  });
}

export function mapAzureBoardsHealthFromConnectionTest(
  result: AzureBoardsConnectionTestResponse,
): AzureBoardsIntegrationHealthResponse {
  if (result.ok === true) {
    return {
      status: AZURE_BOARDS_STORED_HEALTH_HEALTHY,
      reachable: true,
      summary: result.summary?.trim() || "Azure Boards reachable.",
      statusCode: result.statusCode ?? null,
    };
  }

  if (result.statusCode == null) {
    return {
      status: AZURE_BOARDS_STORED_HEALTH_NOT_CONFIGURED,
      reachable: false,
      summary: result.summary?.trim() || "Azure Boards connector credentials are not configured.",
      statusCode: null,
    };
  }

  return {
    status: AZURE_BOARDS_STORED_HEALTH_UNHEALTHY,
    reachable: false,
    summary: result.summary?.trim() || "Azure Boards connection test failed.",
    statusCode: result.statusCode,
  };
}
