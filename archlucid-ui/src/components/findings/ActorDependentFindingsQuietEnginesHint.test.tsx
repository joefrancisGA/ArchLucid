import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { REVIEWS_NEW_GUIDED_INTAKE_HREF } from "@/lib/reviews-new-path-copy";

import { ActorDependentFindingsQuietEnginesHint } from "./ActorDependentFindingsQuietEnginesHint";

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: true }),
}));

describe("ActorDependentFindingsQuietEnginesHint", () => {
  it("renders architecture recovery for Working mode without guided intake", () => {
    render(<ActorDependentFindingsQuietEnginesHint show={true} runId="run-abc" workingMode />);

    expect(screen.getByTestId("run-detail-actor-engines-quiet-hint")).toHaveTextContent("Trust-boundary");
    expect(screen.getByTestId("run-detail-actor-engines-quiet-hint")).toHaveTextContent(
      "Add people and systems on the Architecture tab",
    );
    expect(screen.getByTestId("actor-quiet-engines-architecture-link")).toHaveAttribute(
      "href",
      "/architecture/reviews/run-abc?reviewTab=architecture",
    );
    expect(screen.queryByTestId("actor-quiet-engines-guided-intake-link")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /guided intake/i })).not.toBeInTheDocument();
  });

  it("renders draft actors link when draft is editable", () => {
    render(
      <ActorDependentFindingsQuietEnginesHint
        show={true}
        runId="run-abc"
        workingMode
        draftArchitectureId="draft-1"
        draftHandoffLocked={false}
      />,
    );

    expect(screen.getByTestId("actor-quiet-engines-draft-link")).toHaveAttribute(
      "href",
      "/architecture/architectures/draft-1",
    );
  });

  it("hides draft actors link when handoff is locked", () => {
    render(
      <ActorDependentFindingsQuietEnginesHint
        show={true}
        runId="run-abc"
        workingMode
        draftArchitectureId="draft-1"
        draftHandoffLocked
      />,
    );

    expect(screen.queryByTestId("actor-quiet-engines-draft-link")).not.toBeInTheDocument();
  });

  it("keeps guided intake as a teaching path in Guided mode", () => {
    render(<ActorDependentFindingsQuietEnginesHint show={true} runId="run-abc" workingMode={false} />);

    expect(screen.getByTestId("actor-quiet-engines-architecture-link")).toBeInTheDocument();
    expect(screen.getByTestId("actor-quiet-engines-guided-intake-link")).toHaveAttribute(
      "href",
      REVIEWS_NEW_GUIDED_INTAKE_HREF,
    );
  });

  it("renders nothing when show is false", () => {
    const { container } = render(<ActorDependentFindingsQuietEnginesHint show={false} runId="run-abc" />);

    expect(container).toBeEmptyDOMElement();
  });
});
