import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WizardSubmitProblem } from "@/components/wizard/WizardSubmitProblem";
import { ApiRequestError } from "@/lib/api-request-error";

describe("WizardSubmitProblem", () => {
  it("renders Problem Details and the correlation id for an API failure", () => {
    render(
      <WizardSubmitProblem
        error={
          new ApiRequestError("Not permitted", {
            problem: { title: "Forbidden", detail: "Role cannot create runs", errorCode: "VALIDATION_FAILED" },
            correlationId: "corr-submit-1",
            httpStatus: 403,
          })
        }
      />,
    );

    expect(screen.getByText(/corr-submit-1/)).toBeInTheDocument();
  });

  it("falls back to the thrown message for an unstructured error", () => {
    render(<WizardSubmitProblem error={new Error("Socket closed early")} />);

    expect(screen.getByText("Socket closed early")).toBeInTheDocument();
  });

  it("falls back to generic copy when the thrown value carries no message", () => {
    render(<WizardSubmitProblem error={"boom"} />);

    expect(screen.getByText("Request failed.")).toBeInTheDocument();
  });
});
