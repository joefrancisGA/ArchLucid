import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GUIDED_INTAKE_ACTORS_SECTION_HEADING, GUIDED_INTAKE_TRUST_BOUNDARY_HINT } from "@/lib/guided-intake-copy";
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

describe("DraftIntakeActorEditor", () => {
  it("adds an actor row and marks edits asserted", () => {
    const onChange = vi.fn();

    render(<DraftIntakeActorEditor actorSet={baseActorSet} onChange={onChange} />);

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

  it("shows actors section heading and suggest-actors control", () => {
    const onChange = vi.fn();

    render(<DraftIntakeActorEditor actorSet={baseActorSet} onChange={onChange} onResuggest={vi.fn()} />);

    expect(screen.getByText(GUIDED_INTAKE_ACTORS_SECTION_HEADING)).toBeInTheDocument();
    expect(screen.getByText(GUIDED_INTAKE_TRUST_BOUNDARY_HINT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suggest actors from intent" })).toBeInTheDocument();
  });

  it("updates label and asserts the actor", () => {
    const onChange = vi.fn();

    render(<DraftIntakeActorEditor actorSet={baseActorSet} onChange={onChange} />);

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
});
