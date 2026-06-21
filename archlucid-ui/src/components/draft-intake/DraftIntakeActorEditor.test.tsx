import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  GUIDED_INTAKE_ACTORS_EMPTY_STATE,
  GUIDED_INTAKE_ACTORS_SECTION_HEADING,
  GUIDED_INTAKE_ADD_ACTOR_BUTTON,
  GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON,
  GUIDED_INTAKE_SUGGEST_ACTORS_BUTTON,
  GUIDED_INTAKE_SUGGEST_ACTORS_DISABLED_HINT,
  GUIDED_INTAKE_TRUST_BOUNDARY_HINT,
} from "@/lib/guided-intake-copy";
import type { ActorSet } from "@/types/draft-intake";

import { DraftIntakeActorEditor } from "./DraftIntakeActorEditor";

const baseActorSet: ActorSet = {
  actors: [
    {
      label: "Primary internal user",
      kind: "Human",
      trustOrigin: "Internal",
      contract: "Sync",
      origin: "Inferred",
      confidence: 70,
    },
  ],
};

const sampleIntent =
  "Modernize the claims intake workflow with nightly batch API integration for partners.";

describe("DraftIntakeActorEditor", () => {
  it("shows empty state and disables suggest until intent is long enough", () => {
    const onChange = vi.fn();

    render(
      <DraftIntakeActorEditor actorSet={{ actors: [] }} intentText="" onChange={onChange} />,
    );

    expect(screen.getByText(GUIDED_INTAKE_ACTORS_SECTION_HEADING)).toBeInTheDocument();
    expect(screen.getByText(GUIDED_INTAKE_TRUST_BOUNDARY_HINT)).toBeInTheDocument();
    expect(screen.getByText(GUIDED_INTAKE_ACTORS_EMPTY_STATE)).toBeInTheDocument();
    expect(screen.getByText(GUIDED_INTAKE_SUGGEST_ACTORS_DISABLED_HINT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: GUIDED_INTAKE_SUGGEST_ACTORS_BUTTON })).toBeDisabled();
    expect(screen.getByRole("button", { name: GUIDED_INTAKE_ADD_ACTOR_BUTTON })).toBeInTheDocument();
  });

  it("adds an actor row and marks manual adds asserted", () => {
    const onChange = vi.fn();

    render(<DraftIntakeActorEditor actorSet={baseActorSet} intentText={sampleIntent} onChange={onChange} />);

    fireEvent.click(screen.getByTestId("draft-intake-actor-add"));

    expect(onChange).toHaveBeenCalledWith({
      actors: [
        ...baseActorSet.actors,
        {
          label: "",
          kind: "Human",
          trustOrigin: "Internal",
          contract: "Sync",
          origin: "Asserted",
          confidence: 100,
        },
      ],
    });
  });

  it("opens a checkbox suggestion panel and adds only selected actors", () => {
    const onChange = vi.fn();

    render(<DraftIntakeActorEditor actorSet={{ actors: [] }} intentText={sampleIntent} onChange={onChange} />);

    fireEvent.click(screen.getByTestId("draft-intake-actor-suggest"));
    expect(screen.getByTestId("draft-intake-actor-suggestions-panel")).toBeInTheDocument();

    const machineSuggestion = screen.getByText("Machine integration");
    const machineCheckbox = machineSuggestion.closest("label")?.querySelector("input");

    if (machineCheckbox === null || machineCheckbox === undefined) {
      throw new Error("Expected machine suggestion checkbox");
    }

    fireEvent.click(machineCheckbox);
    fireEvent.click(screen.getByRole("button", { name: GUIDED_INTAKE_ADD_SELECTED_ACTORS_BUTTON }));

    expect(onChange).toHaveBeenCalledWith({
      actors: [
        expect.objectContaining({
          label: "Machine integration",
          kind: "Machine",
          origin: "Inferred",
        }),
      ],
    });
  });

  it("updates label and asserts the actor", () => {
    const onChange = vi.fn();

    render(<DraftIntakeActorEditor actorSet={baseActorSet} intentText={sampleIntent} onChange={onChange} />);

    fireEvent.change(screen.getByTestId("draft-intake-actor-label-0"), {
      target: { value: "Claims analyst" },
    });

    expect(onChange).toHaveBeenCalledWith({
      actors: [
        {
          ...baseActorSet.actors[0],
          label: "Claims analyst",
          origin: "Asserted",
          confidence: 100,
        },
      ],
    });
  });

  it("confirms a suggested actor without editing fields", () => {
    const onChange = vi.fn();

    render(<DraftIntakeActorEditor actorSet={baseActorSet} intentText={sampleIntent} onChange={onChange} />);

    fireEvent.click(screen.getByTestId("draft-intake-actor-confirm-0"));

    expect(onChange).toHaveBeenCalledWith({
      actors: [
        {
          ...baseActorSet.actors[0],
          origin: "Asserted",
          confidence: 100,
        },
      ],
    });
  });
});
