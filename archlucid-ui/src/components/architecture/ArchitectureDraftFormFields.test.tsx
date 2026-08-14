import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { architectureCreationDefaultActorSet } from "@/lib/architecture/architecture-creation-init";
import { ARCHITECTURE_DRAFT_ALTERNATIVES_HINT } from "@/lib/create-vs-review-intake-copy";
import { GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER } from "@/lib/guided-intake-copy";

// The actor editor owns its own suggestion fetches; this suite only covers the overview field helpers.
vi.mock("@/components/draft-intake/DraftIntakeActorEditor", () => ({
  DraftIntakeActorEditor: () => <div data-testid="draft-intake-actor-editor" />,
}));

function renderFields(overview: string): void {
  render(
    <ArchitectureDraftFormFields
      fields={{ freeTextIntent: overview, businessOutcome: "", systemName: "" }}
      actorSet={architectureCreationDefaultActorSet()}
      onFieldsChange={() => undefined}
      onActorSetChange={() => undefined}
    />,
  );
}

describe("ArchitectureDraftFormFields", () => {
  it("prompts for alternatives and tradeoffs while the overview is empty", () => {
    renderFields("");

    expect(screen.getByTestId("architecture-draft-intent-alternatives-hint")).toHaveTextContent(
      ARCHITECTURE_DRAFT_ALTERNATIVES_HINT,
    );
    expect(screen.getByText(GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER)).toBeInTheDocument();
  });

  it("keeps the tradeoff prompt after the overview outgrows its character-count helper", () => {
    renderFields("a".repeat(6228));

    expect(screen.getByText("6228 characters.")).toBeInTheDocument();
    expect(screen.getByTestId("architecture-draft-intent-alternatives-hint")).toHaveTextContent(
      ARCHITECTURE_DRAFT_ALTERNATIVES_HINT,
    );
  });
});
