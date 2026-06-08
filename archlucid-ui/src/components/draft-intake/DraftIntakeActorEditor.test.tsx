import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
