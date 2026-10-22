import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ArchitectureDraftFieldState } from "@/lib/architecture/architecture-draft-readiness";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import {
  clearArchitectureNewDraftRecovery,
  readArchitectureNewDraftRecovery,
  resetArchitectureNewDraftRecoveryForTests,
  writeArchitectureNewDraftRecovery,
} from "@/lib/architecture/architecture-new-draft-recovery";
import type { ActorSet } from "@/types/draft-intake";

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

const fields: ArchitectureDraftFieldState = {
  freeTextIntent: "Architecture overview text long enough for recovery round-trip validation in tests.",
  businessOutcome: "Reduce review cycle time.",
  systemName: "Claims intake",
  structuredBrief: emptyArchitectureDraftStructuredBrief(),
};

describe("architecture-new-draft-recovery (WS-15)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    resetArchitectureNewDraftRecoveryForTests();
  });

  it("round-trips a new-draft recovery snapshot", () => {
    writeArchitectureNewDraftRecovery({
      fields,
      actorSet,
      queuedAtUtc: "2026-09-08T12:00:00.000Z",
    });

    expect(readArchitectureNewDraftRecovery()?.fields.systemName).toBe("Claims intake");
    expect(readArchitectureNewDraftRecovery()?.actorSet.actors).toHaveLength(1);
  });

  it("clears recovery after server create succeeds", () => {
    writeArchitectureNewDraftRecovery({
      fields,
      actorSet,
      queuedAtUtc: "2026-09-08T12:00:00.000Z",
    });

    clearArchitectureNewDraftRecovery();

    expect(readArchitectureNewDraftRecovery()).toBeNull();
  });

  it("falls back to a fresh timestamp when persisted queuedAtUtc is malformed", () => {
    window.localStorage.setItem(
      "archlucid.architecture-new-draft-recovery.v1",
      JSON.stringify({ fields, actorSet, queuedAtUtc: "not-a-date" }),
    );

    const snapshot = readArchitectureNewDraftRecovery();

    expect(snapshot).not.toBeNull();
    expect(snapshot?.queuedAtUtc).not.toBe("not-a-date");
    expect(Number.isNaN(Date.parse(snapshot?.queuedAtUtc ?? ""))).toBe(false);
  });
});
