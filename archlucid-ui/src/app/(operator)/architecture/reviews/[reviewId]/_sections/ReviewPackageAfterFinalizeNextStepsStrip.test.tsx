import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewPackageAfterFinalizeNextStepsStrip } from "./ReviewPackageAfterFinalizeNextStepsStrip";

describe("ReviewPackageAfterFinalizeNextStepsStrip", () => {
  it("links invite, compare, and sponsor report actions", () => {
    render(<ReviewPackageAfterFinalizeNextStepsStrip runId="run-final" priorRunId="run-prior" />);

    expect(screen.getByTestId("review-package-after-finalize-next-steps-strip")).toBeInTheDocument();
    expect(screen.getByTestId("review-package-after-finalize-invite")).toHaveAttribute(
      "href",
      "/administration/users/invite-reviewer?reviewId=run-final",
    );
    expect(screen.getByTestId("review-package-after-finalize-sponsor-report")).toHaveAttribute(
      "href",
      "/insights/sponsor-report?runId=run-final",
    );
  });
});
