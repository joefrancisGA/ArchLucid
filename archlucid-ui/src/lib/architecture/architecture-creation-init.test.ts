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
} from "@/lib/architecture/architecture-creation-init";
import { ARCHITECTURE_CREATION_BOOTSTRAP_INTENT } from "@/lib/architecture/architecture-creation-bootstrap";
import {
  readArchitectureCreationDraftId,
  writeArchitectureCreationDraftId,
} from "@/lib/architecture/architecture-creation-session";
import { ARCHITECTURE_CREATION_UNIVERSAL_QUESTIONS } from "@/lib/architecture/architecture-creation-question-definition";
import { CREATE_ARCHITECTURE_INTENT } from "@/lib/architecture/architecture-workflow-intent";

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

    expect(createDraftRequest).toHaveBeenCalledWith(ARCHITECTURE_CREATION_BOOTSTRAP_INTENT, CREATE_ARCHITECTURE_INTENT);
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

  it("strips a previously merged scope block out of loaded brief fields", () => {
    expect(
      applyArchitectureCreationDraftToFormState({
        draftId: "draft-polluted",
        document: {
          freeTextIntent:
            "Vertex tenant migration.\n\nOperator-confirmed in-scope understanding:\n- Primary system or architecture: Vertex",
          businessOutcome:
            "faster and better\n\nOperator-confirmed in-scope understanding:\n- Business outcome: faster and better",
          systemName: "Vertex",
          actorSet: { actors: [] },
        },
        status: "Drafting",
      } as never),
    ).toEqual({
      freeTextIntent: "Vertex tenant migration.",
      businessOutcome: "faster and better",
      systemName: "Vertex",
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
    expect(result.failureDetail).toBeNull();
    expect(readArchitectureCreationDraftId()).toBe("draft-recreated");
  });

  it("surfaces verbose API failure detail when draft create fails", async () => {
    const { ApiRequestError } = await import("@/lib/api-request-error");
    createDraftRequest.mockRejectedValue(
      new ApiRequestError("Request failed (401 Unauthorized)", {
        problem: {
          detail: "Authentication is required.",
          title: "Unauthorized",
          status: 401,
          type: "about:blank",
        },
        correlationId: "corr-create",
        httpStatus: 401,
      }),
    );

    const result = await initializeArchitectureCreation();

    expect(result.draftId).toBeNull();
    expect(result.failureDetail).toContain("Authentication is required.");
    expect(result.failureDetail).toContain("HTTP 401");
    expect(result.failureDetail).toContain("Correlation ID: corr-create");
  });
});
