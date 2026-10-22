import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ArchitectureDraftFormFields } from "@/components/architecture/ArchitectureDraftFormFields";
import { architectureCreationDefaultActorSet } from "@/lib/architecture/architecture-creation-init";
import { emptyArchitectureDraftStructuredBrief } from "@/lib/architecture/architecture-draft-structured-brief";
import { GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER } from "@/lib/guided-intake-copy";

// The actor editor owns its own suggestion fetches; this suite only covers the overview field helpers.
vi.mock("@/components/draft-intake/DraftIntakeActorEditor", () => ({
  DraftIntakeActorEditor: () => <div data-testid="draft-intake-actor-editor" />,
}));

vi.mock("@/components/architecture/ArchitectureDraftStructuredBriefFields", () => ({
  ArchitectureDraftStructuredBriefFields: () => <div data-testid="architecture-draft-structured-brief-stub" />,
}));

vi.mock("@/components/architecture/ArchitectureDraftRequirementsUploadPanel", () => ({
  ArchitectureDraftRequirementsUploadPanel: () => <div data-testid="architecture-draft-requirements-upload-stub" />,
}));

function renderFields(overview: string): void {
  render(
    <ArchitectureDraftFormFields
      fields={{
        freeTextIntent: overview,
        businessOutcome: "",
        systemName: "",
        structuredBrief: emptyArchitectureDraftStructuredBrief(),
      }}
      actorSet={architectureCreationDefaultActorSet()}
      onFieldsChange={() => undefined}
      onActorSetChange={() => undefined}
    />,
  );
}

describe("ArchitectureDraftFormFields", () => {
  it("does not render overview teaching copy until the operator starts typing", () => {
    renderFields("");

    expect(screen.queryByTestId("architecture-draft-intent-alternatives-hint")).not.toBeInTheDocument();
    expect(screen.queryByText(GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER)).not.toBeInTheDocument();
  });

  it("shows only the live character count once the overview has content", () => {
    renderFields("a".repeat(6228));

    expect(screen.getByText("6228 characters.")).toBeInTheDocument();
    expect(screen.queryByTestId("architecture-draft-intent-alternatives-hint")).not.toBeInTheDocument();
    expect(screen.queryByText(GUIDED_INTAKE_CREATION_ARCHITECTURE_OVERVIEW_MIN_HELPER)).not.toBeInTheDocument();
  });
});
