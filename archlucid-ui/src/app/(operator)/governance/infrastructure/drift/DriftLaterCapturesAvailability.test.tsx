import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DriftLaterCapturesAvailability } from "@/app/(operator)/governance/infrastructure/drift/DriftLaterCapturesAvailability";

describe("DriftLaterCapturesAvailability", () => {
  it("describes same-subscription and cross-subscription later captures", () => {
    render(
      <DriftLaterCapturesAvailability
        partition={{
          sameSubscription: [{ snapshotId: "a" } as never],
          crossSubscription: [{ snapshotId: "b" } as never, { snapshotId: "c" } as never],
        }}
      />,
    );

    expect(screen.getByTestId("infra-drift-later-captures-summary")).toHaveTextContent(
      "1 later capture available in the same subscription.",
    );
    expect(screen.getByTestId("infra-drift-later-captures-summary")).toHaveTextContent(
      "2 later captures available in other subscriptions.",
    );
  });
});
