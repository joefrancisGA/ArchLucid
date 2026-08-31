import { apiGet } from "@/lib/api";

export const WORKSPACE_AI_AVAILABILITY_PATH = "/v1/diagnostics/workspace-ai-availability";

/** Client-side budget aligned with server probe timeout + network margin. */
export const WORKSPACE_AI_AVAILABILITY_FETCH_TIMEOUT_MS = 8_000;

export type WorkspaceAiAvailabilityCheckRow = {
  readonly name: string;
  readonly status: "ok" | "failed" | "degraded" | "skipped" | string;
  readonly detail: string;
};

/** Mirrors `GET /v1/diagnostics/workspace-ai-availability` (camelCase JSON). */
export type WorkspaceAiAvailabilityResult = {
  readonly isAvailable: boolean;
  readonly validated: boolean;
  readonly aiSource: "managed-platform" | "customer-connection" | "simulator" | string;
  readonly summary: string;
  readonly asOfUtc: string;
  readonly checks: readonly WorkspaceAiAvailabilityCheckRow[];
  readonly debug: Readonly<Record<string, string>>;
};

export async function fetchWorkspaceAiAvailability(
  options?: { readonly signal?: AbortSignal },
): Promise<WorkspaceAiAvailabilityResult> {
  return apiGet<WorkspaceAiAvailabilityResult>(WORKSPACE_AI_AVAILABILITY_PATH, options);
}

export function workspaceAiAvailabilityStatusLabel(result: WorkspaceAiAvailabilityResult): string {
  if (!result.validated) {
    return "AI availability not verified";
  }

  if (result.isAvailable) {
    return result.aiSource === "simulator"
      ? "Simulator mode — live platform AI not required"
      : "AI availability probe succeeded";
  }

  if (result.aiSource === "managed-platform" && result.summary.includes("Azure OpenAI")) {
    return "Real mode — live AI not configured";
  }

  if (result.aiSource === "customer-connection") {
    return "Workspace AI connection unavailable";
  }

  return "Workspace AI availability";
}

export function workspaceAiUnavailableDetail(result: WorkspaceAiAvailabilityResult): string {
  if (result.summary.trim().length > 0) {
    return result.summary;
  }

  if (result.aiSource === "customer-connection") {
    return "Your workspace customer-provided AI connection is unavailable — reviews cannot start until the connection is restored.";
  }

  return "ArchLucid-managed AI is unavailable — reviews cannot start until platform AI is restored.";
}
