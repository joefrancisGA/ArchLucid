import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_DIAGRAM_PEOPLE_AND_SYSTEMS_ACTOR_NAME_NOT_STORED,
  ARCHITECTURE_DIAGRAM_PEOPLE_AND_SYSTEMS_ACTOR_NAME_STORED_EMPTY,
} from "@/lib/architecture/architecture-diagram-copy";
import {
  createEmptyDrafts,
  finalizeSections,
  mergeUserAssertions,
} from "@/lib/architecture/generated-content-section-blocks";

describe("mergeUserAssertions", () => {
  it("does not copy overview into scope when scope was not stored (P-06)", () => {
    const drafts = createEmptyDrafts();

    mergeUserAssertions(drafts, {
      architectureName: "Payments",
      architectureOverview: "Overview-only brief without a dedicated scope section.",
      businessOutcome: "",
      peopleAndSystems: [],
    });

    const sections = finalizeSections(drafts);
    const scope = sections.find((section) => section.key === "scope");

    expect(scope).toBeUndefined();
  });

  it("notes empty actor names without drawing them (P-13)", () => {
    const notes = mergeUserAssertions(createEmptyDrafts(), {
      architectureName: "Payments",
      architectureOverview: "",
      businessOutcome: "",
      peopleAndSystems: [{ label: "", kind: "Human" }],
    });

    expect(notes).toContain(ARCHITECTURE_DIAGRAM_PEOPLE_AND_SYSTEMS_ACTOR_NAME_NOT_STORED);
  });

  it("notes whitespace-only actor names as stored empty (P-13)", () => {
    const notes = mergeUserAssertions(createEmptyDrafts(), {
      architectureName: "Payments",
      architectureOverview: "",
      businessOutcome: "",
      peopleAndSystems: [{ label: "   ", kind: "Machine" }],
    });

    expect(notes).toContain(ARCHITECTURE_DIAGRAM_PEOPLE_AND_SYSTEMS_ACTOR_NAME_STORED_EMPTY);
  });

  it("notes stored Vendor kind without a diagram role (P-14)", () => {
    const notes = mergeUserAssertions(createEmptyDrafts(), {
      architectureName: "Payments",
      architectureOverview: "",
      businessOutcome: "",
      peopleAndSystems: [{ label: "Stripe", kind: "Vendor" }],
    });

    expect(notes.some((note) => note.includes("Vendor has no diagram role"))).toBe(true);
  });
});
