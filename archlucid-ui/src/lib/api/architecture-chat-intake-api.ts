import type { CreateArchitectureRunRequestPayload } from "./architecture-runs";
import { apiPostJson } from "./http";

/** Body for POST /v1/architecture/chat-intake. */
export type ChatIntakeRequest = {
  rawText: string;
};

/** Structured architecture request returned from chat intake (preview only — not persisted). */
export type ChatIntakeArchitectureRequest = CreateArchitectureRunRequestPayload & {
  requestId: string;
};

/** Calls POST /v1/architecture/chat-intake to map unstructured text into a wizard-ready request. */
export async function parseChatIntake(rawText: string): Promise<ChatIntakeArchitectureRequest> {
  return apiPostJson<ChatIntakeArchitectureRequest>("/v1/architecture/chat-intake", {
    rawText: rawText.trim(),
  });
}
