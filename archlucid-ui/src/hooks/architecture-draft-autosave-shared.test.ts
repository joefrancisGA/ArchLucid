import { describe, expect, it } from "vitest";

import {
  actorSetsAreEqual,
  createIntentForDeferredDraft,
  fieldsAreEqual,
  isNonRetryableDraftPatchError,
} from "@/hooks/architecture-draft-autosave-shared";
import { ARCHITECTURE_CREATION_BOOTSTRAP_INTENT } from "@/lib/architecture/architecture-creation-bootstrap";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { ApiRequestError } from "@/lib/api-request-error";
import type { ActorSet } from "@/types/draft-intake";

const baseFields: ArchitectureDraftFieldState = {
  freeTextIntent: "Intent",
  businessOutcome: "Outcome",
  systemName: "System",
  structuredBrief: emptyArchitectureDraftStructuredBrief(),
};

const actorSet: ActorSet = {
  actors: [
    {
      label: "Primary operator",
      kind: "Human",
      trustOrigin: "Internal",
      contract: "Sync",
      origin: "Asserted",
      confidence: 100,
    },
  ],
};

describe("architecture-draft-autosave-shared", () => {
  it("detects equal field snapshots", () => {
    expect(fieldsAreEqual(baseFields, { ...baseFields })).toBe(true);
    expect(fieldsAreEqual(baseFields, { ...baseFields, systemName: "Other" })).toBe(false);
  });

  it("detects equal actor sets", () => {
    expect(actorSetsAreEqual(actorSet, { ...actorSet, actors: [...actorSet.actors] })).toBe(true);
  });

  it("falls back to bootstrap intent for deferred create when overview is empty", () => {
    expect(createIntentForDeferredDraft({ ...baseFields, freeTextIntent: "   " })).toBe(
      ARCHITECTURE_CREATION_BOOTSTRAP_INTENT,
    );
  });

  it("classifies non-retryable draft patch errors", () => {
    expect(isNonRetryableDraftPatchError(new ApiRequestError("bad", { problem: null, correlationId: null, httpStatus: 400 }))).toBe(true);
    expect(isNonRetryableDraftPatchError(new Error("network"))).toBe(false);
  });
});
