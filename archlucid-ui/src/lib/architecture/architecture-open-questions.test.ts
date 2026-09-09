import { describe, expect, it } from "vitest";

import {
  buildArchitectureDraftPatchPayload,
  architectureDraftFieldsFromDocument,
} from "@/lib/architecture/architecture-draft-readiness";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import type { ActorDescriptor, DraftRequestResponse } from "@/types/draft-intake";

const actor: ActorDescriptor = {
  label: "Primary operator",
  kind: "Human",
  trustOrigin: "Internal",
  contract: "Sync",
  origin: "Asserted",
  confidence: 100,
};

describe("architecture open questions (WS-19)", () => {
  it("round-trips openQuestions through patch payload and document hydration", () => {
    const draft: DraftRequestResponse = {
      draftId: "draft-open-questions",
      tenantId: "tenant",
      workspaceId: "ws",
      projectId: "default",
      status: "Drafting",
      document: {
        freeTextIntent:
          "We are designing a structured workflow platform for analysts with authentication, auditable evidence trails, and exportable architecture reviews.",
        businessOutcome: "Reduce cycle time for architecture reviews.",
        systemName: "Claims intake",
        openQuestions: "Who owns data retention approvals?",
        actorSet: { actors: [actor] },
      },
      createdUtc: "2026-01-01T00:00:00.000Z",
      updatedUtc: "2026-01-01T00:00:00.000Z",
    };

    const fields = architectureDraftFieldsFromDocument(draft);

    expect(fields.openQuestions).toBe("Who owns data retention approvals?");

    const patch = buildArchitectureDraftPatchPayload(fields, draft.document.actorSet);

    expect(patch.openQuestions).toBe("Who owns data retention approvals?");
  });

  it("does not require openQuestions for saveable content", () => {
    const fields = {
      freeTextIntent:
        "We are designing a structured workflow platform for analysts with authentication, auditable evidence trails, and exportable architecture reviews.",
      businessOutcome: "Reduce cycle time for architecture reviews.",
      systemName: "Claims intake",
      structuredBrief: emptyArchitectureDraftStructuredBrief(),
      openQuestions: "",
    };

    const patch = buildArchitectureDraftPatchPayload(fields, { actors: [actor] });

    expect(patch.openQuestions).toBe("");
  });
});
