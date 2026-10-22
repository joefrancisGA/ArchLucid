import type { components } from "@/lib/openapi-schemas";

type ConversationThreadSchema = components["schemas"]["ConversationThread"];

/** A conversation thread in the ArchLucid Ask system (scoped to tenant/workspace/project). */
export type ConversationThread = ConversationThreadSchema &
  Required<
    Pick<
      ConversationThreadSchema,
      | "threadId"
      | "tenantId"
      | "workspaceId"
      | "projectId"
      | "title"
      | "createdUtc"
      | "lastUpdatedUtc"
    >
  >;

type ConversationMessageSchema = components["schemas"]["ConversationMessage"];

/** A single message in a conversation thread (user question or AI response). */
export type ConversationMessage = ConversationMessageSchema &
  Required<
    Pick<ConversationMessageSchema, "messageId" | "threadId" | "role" | "content" | "createdUtc" | "metadataJson">
  >;

type AskResponseSchema = components["schemas"]["AskResponse"];

/** Response from the /api/ask endpoint: answer text plus referenced decisions/findings/artifacts. */
export type AskResponse = AskResponseSchema &
  Required<
    Pick<
      AskResponseSchema,
      "threadId" | "answer" | "referencedDecisions" | "referencedFindings" | "referencedArtifacts"
    >
  >;
