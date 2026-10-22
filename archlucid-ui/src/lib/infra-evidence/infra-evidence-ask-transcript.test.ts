import { afterEach, describe, expect, it } from "vitest";

import { OIDC_USER_SUBJECT_KEY } from "@/lib/oidc/storage-keys";

import {
  buildInfraEvidenceAskScopeKey,
  clearInfraEvidenceAskTranscriptStorage,
  mergeCannedQuestionIntoDraft,
  readInfraEvidenceAskTranscript,
  shouldSkipInfraEvidenceAskTranscriptWrite,
  writeInfraEvidenceAskTranscript,
} from "@/lib/infra-evidence/infra-evidence-ask-transcript";

describe("infra-evidence-ask-transcript", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("builds stable scope keys from ask URL params", () => {
    expect(
      buildInfraEvidenceAskScopeKey({
        cloudResourceId: "res-1",
        snapshotId: "snap-1",
      }),
    ).toBe("res-1|snap-1|_|_|_|_|_|_|_|_|_|_|_");
  });

  it("partitions transcript storage by signed-in user subject", () => {
    window.sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-a");
    const scopeKey = buildInfraEvidenceAskScopeKey({ cloudResourceId: "res-1" });

    writeInfraEvidenceAskTranscript(scopeKey, {
      turns: [],
      draft: "User A draft",
    });

    window.sessionStorage.setItem(OIDC_USER_SUBJECT_KEY, "user-b");

    expect(readInfraEvidenceAskTranscript(scopeKey)).toEqual({
      turns: [],
      draft: "",
    });
  });

  it("skips empty writes while stored transcript is still rehydrating", () => {
    const scopeKey = buildInfraEvidenceAskScopeKey({ cloudResourceId: "res-1" });

    writeInfraEvidenceAskTranscript(scopeKey, {
      turns: [
        {
          question: "Persisted?",
          response: {
            topicKind: "ResourceOverview",
            answer: "Yes",
            insufficientEvidence: false,
            citations: [],
            simulatorLabel: null,
          },
        },
      ],
      draft: "Draft",
    });

    expect(
      shouldSkipInfraEvidenceAskTranscriptWrite(scopeKey, {
        turns: [],
        draft: "",
      }),
    ).toBe(true);
  });

  it("clears all ask transcript keys on logout cleanup", () => {
    const scopeKey = buildInfraEvidenceAskScopeKey({ cloudResourceId: "res-1" });

    writeInfraEvidenceAskTranscript(scopeKey, {
      turns: [],
      draft: "Draft",
    });

    clearInfraEvidenceAskTranscriptStorage();

    expect(readInfraEvidenceAskTranscript(scopeKey)).toEqual({
      turns: [],
      draft: "",
    });
  });

  it("persists and rehydrates turns and draft per scope key", () => {
    const scopeKey = buildInfraEvidenceAskScopeKey({ cloudResourceId: "res-1" });

    writeInfraEvidenceAskTranscript(scopeKey, {
      turns: [
        {
          question: "First?",
          response: {
            topicKind: "ResourceOverview",
            answer: "Answer one",
            insufficientEvidence: false,
            citations: [],
            simulatorLabel: null,
          },
        },
      ],
      draft: "Draft question",
    });

    expect(readInfraEvidenceAskTranscript(scopeKey)).toEqual({
      turns: [
        {
          question: "First?",
          response: {
            topicKind: "ResourceOverview",
            answer: "Answer one",
            insufficientEvidence: false,
            citations: [],
            simulatorLabel: null,
          },
        },
      ],
      draft: "Draft question",
    });
  });

  it("merges canned prompts into an existing draft without replacing it", () => {
    expect(mergeCannedQuestionIntoDraft("", "What changed since baseline?")).toBe(
      "What changed since baseline?",
    );
    expect(
      mergeCannedQuestionIntoDraft("Partial ", "What changed since baseline?"),
    ).toBe("Partial What changed since baseline?");
    expect(
      mergeCannedQuestionIntoDraft("What changed since baseline?", "What changed since baseline?"),
    ).toBe("What changed since baseline?");
    expect(
      mergeCannedQuestionIntoDraft("What changed since baseline?", "Why is this PIP public?"),
    ).toBe("What changed since baseline? Why is this PIP public?");
  });
});
