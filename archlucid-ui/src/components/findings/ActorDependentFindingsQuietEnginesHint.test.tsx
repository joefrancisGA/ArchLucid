import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { REVIEWS_NEW_GUIDED_INTAKE_HREF } from "@/lib/reviews-new-path-copy";

import {
  ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_COPY,
  ActorDependentFindingsQuietEnginesHint,
} from "./ActorDependentFindingsQuietEnginesHint";

describe("ActorDependentFindingsQuietEnginesHint", () => {
  it("renders trust-boundary copy and guided-intake link when shown", () => {
    render(<ActorDependentFindingsQuietEnginesHint show={true} />);

    expect(screen.getByTestId("run-detail-actor-engines-quiet-hint")).toHaveTextContent(
      "Trust-boundary",
    );
    expect(screen.getByTestId("run-detail-actor-engines-quiet-hint")).toHaveTextContent(
      ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_COPY,
    );
    expect(
      screen.getByRole("link", { name: /Open guided intake — People, systems, and integrations/i }),
    ).toHaveAttribute("href", REVIEWS_NEW_GUIDED_INTAKE_HREF);
  });

  it("renders nothing when actors are present", () => {
    const { container } = render(<ActorDependentFindingsQuietEnginesHint show={false} />);

    expect(container).toBeEmptyDOMElement();
  });
});
