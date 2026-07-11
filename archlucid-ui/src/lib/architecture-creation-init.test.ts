import { beforeEach, describe, expect, it, vi } from "vitest";

const createDraftRequest = vi.fn();
const getDraftRequest = vi.fn();

vi.mock("@/lib/api/draft-intake-api", () => ({
  createDraftRequest: (...args: unknown[]) => createDraftRequest(...args),
  getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
  buildDefaultActorSet: () => ({ actors: [] }),
}));

import {
  applyArchitectureCreationDraftToFormState,
  initializeArchitectureCreation,
  resetArchitectureCreationInitForTests,
} from "@/lib/architecture-creation-init";
import { ARCHITECTURE_CREATION_BOOTSTRAP_INTENT } from "@/lib/architecture-creation-bootstrap";
import {
  clearArchitectureCreationDraftId,
  readArchitectureCreationDraftId,
  writeArchitectureCreationDraftId,
} from "@/lib/architecture-creation-session";
import { ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS } from "@/lib/architecture-creation-question-definition";

describe("initializeArchitectureCreation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetArchitectureCreationInitForTests();
    createDraftRequest.mockReset();
    getDraftRequest.mockReset();
  });

  it("restores an existing draft idempotently without creating a duplicate", async () => {
    writeArchitectureCreationDraftId("draft-existing");
    getDraftRequest.mockResolvedValue({
      draftId: "draft-existing",
      document: { freeTextIntent: "Existing architecture intent that is long enough to satisfy validation rules for draft intake.", actorSet: { actors: [] } },
      status: "Drafting",
    });

    const first = await initializeArchitectureCreation();
    const second = await initializeArchitectureCreation();

    expect(first.draftId).toBe("draft-existing");
    expect(second.draftId).toBe("draft-existing");
    expect(createDraftRequest).not.toHaveBeenCalled();
    expect(first.questionSelection.allQuestions).toHaveLength(ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS.length);
  });

  it("creates a bootstrap draft when no session draft exists", async () => {
    createDraftRequest.mockResolvedValue({
      draftId: "draft-new",
      document: { freeTextIntent: ARCHITECTURE_CREATION_BOOTSTRAP_INTENT, actorSet: { actors: [] } },
      status: "Drafting",
    });

    const result = await initializeArchitectureCreation();

    expect(createDraftRequest).toHaveBeenCalledWith(ARCHITECTURE_CREATION_BOOTSTRAP_INTENT);
    expect(readArchitectureCreationDraftId()).toBe("draft-new");
    expect(result.draftId).toBe("draft-new");
  });

  it("clears bootstrap intent from form state", () => {
    expect(
      applyArchitectureCreationDraftToFormState({
        draftId: "draft-new",
        document: { freeTextIntent: ARCHITECTURE_CREATION_BOOTSTRAP_INTENT, actorSet: { actors: [] } },
        status: "Drafting",
      } as never),
    ).toEqual({
      freeTextIntent: "",
      businessOutcome: "",
      systemName: "",
    });
  });

  it("recreates the draft when the stored draft no longer exists", async () => {
    writeArchitectureCreationDraftId("draft-missing");
    getDraftRequest.mockRejectedValue(new Error("not found"));
    createDraftRequest.mockResolvedValue({
      draftId: "draft-recreated",
      document: { freeTextIntent: ARCHITECTURE_CREATION_BOOTSTRAP_INTENT, actorSet: { actors: [] } },
      status: "Drafting",
    });

    const result = await initializeArchitectureCreation();

    expect(createDraftRequest).toHaveBeenCalledTimes(1);
    expect(result.draftId).toBe("draft-recreated");
    expect(readArchitectureCreationDraftId()).toBe("draft-recreated");
  });
});
