import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingOptionalArtifactUnavailable } from "@/components/findings/FindingOptionalArtifactUnavailable";

describe("FindingOptionalArtifactUnavailable", () => {
  it("hides HTTP status on buyer-polished shell", () => {
    render(
      <FindingOptionalArtifactUnavailable
        heading="Explainability trace unavailable"
        body="Explainability was not generated for this review."
        buyerPolishedShell
        failure={{
          message: "Request failed (404)",
          httpStatus: 404,
          correlationId: "corr-1",
          problem: { status: 404, title: "Not Found" },
        }}
      />,
    );

    expect(screen.getByText(/Explainability was not generated/)).toBeTruthy();
    expect(screen.queryByText("404")).toBeNull();
    expect(screen.queryByText("Technical details")).toBeNull();
  });

  it("shows technical details for operator shell", () => {
    render(
      <FindingOptionalArtifactUnavailable
        heading="Audit record unavailable"
        body="No audit record is attached."
        failure={{
          message: "Request failed (404)",
          httpStatus: 404,
          correlationId: "corr-2",
          problem: { status: 404, title: "Not Found" },
        }}
      />,
    );

    expect(screen.getByText("Technical details")).toBeTruthy();
  });
});
