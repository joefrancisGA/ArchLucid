/** Shared types and pure helpers for the internal deployment-status view. */

import type { EnterpriseStatusKind } from "@/lib/design-tokens";

export const DEPLOYMENT_STATUS_UNKNOWN = "Unknown";

export type DeploymentOverallStatus = "Healthy" | "Warning" | "Failed" | "Unknown";

export type DeploymentAgreement = "Match" | "Mismatch" | "Partial" | "Unknown";

export type AdminDeploymentStatusLink = {
  readonly kind: string;
  readonly label: string;
  readonly url: string;
};

export type AdminDeploymentStatusResponse = {
  readonly environment: string;
  readonly releaseBuildId: string;
  readonly sourceCommit: string;
  readonly frontendBuildId: string;
  readonly apiBuildId: string;
  readonly workerBuildId: string;
  readonly deploymentTimeUtc: string;
  readonly activePlatformRevision: string;
  readonly healthStatus: string;
  readonly readinessStatus: string;
  readonly databaseMigrationVersion: string;
  readonly latestSmokeTestResult: string;
  readonly lastKnownGoodBuildId: string;
  readonly componentAgreement: string;
  readonly componentAgreementDetail: string;
  readonly overallStatus: string;
  readonly overallStatusLabel: string;
  readonly links: AdminDeploymentStatusLink[];
  readonly generatedAtUtc: string;
};

export const ADMIN_DEPLOYMENT_STATUS_PROXY_PATH = "/api/proxy/v1/internal/deployment-status";

export function displayDeploymentField(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();

  if (trimmed.length === 0) {
    return DEPLOYMENT_STATUS_UNKNOWN;
  }

  if (trimmed.toLowerCase() === "unknown") {
    return DEPLOYMENT_STATUS_UNKNOWN;
  }

  return trimmed;
}

export function resolveOverallTone(status: string): DeploymentOverallStatus {
  const normalized = displayDeploymentField(status);

  if (normalized === "Healthy") {
    return "Healthy";
  }

  if (normalized === "Warning") {
    return "Warning";
  }

  if (normalized === "Failed") {
    return "Failed";
  }

  return "Unknown";
}

export function deploymentOverallStatusTagKind(tone: DeploymentOverallStatus): EnterpriseStatusKind {
  switch (tone) {
    case "Healthy":
      return "ready";
    case "Warning":
      return "needs-attention";
    case "Failed":
      return "blocked";
    case "Unknown":
      return "neutral";
    default: {
      const exhaustive: never = tone;
      return exhaustive;
    }
  }
}

export function deploymentOverallStatusShortLabel(tone: DeploymentOverallStatus): string {
  switch (tone) {
    case "Healthy":
      return "Healthy";
    case "Warning":
      return "Warning";
    case "Failed":
      return "Failed";
    case "Unknown":
      return "Unknown";
    default: {
      const exhaustive: never = tone;
      return exhaustive;
    }
  }
}

export function buildDeploymentStatusRequestUrl(frontendBuildId: string): string {
  const params = new URLSearchParams();
  const trimmed = frontendBuildId.trim();

  if (trimmed.length > 0 && trimmed.toLowerCase() !== "unknown") {
    params.set("frontendBuildId", trimmed);
  }

  const query = params.toString();

  if (query.length === 0) {
    return ADMIN_DEPLOYMENT_STATUS_PROXY_PATH;
  }

  return `${ADMIN_DEPLOYMENT_STATUS_PROXY_PATH}?${query}`;
}
