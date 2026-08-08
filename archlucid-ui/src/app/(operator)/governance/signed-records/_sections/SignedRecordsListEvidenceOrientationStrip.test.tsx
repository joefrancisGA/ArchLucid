import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SignedRecordsListEvidenceOrientationStrip } from "./SignedRecordsListEvidenceOrientationStrip";

describe("SignedRecordsListEvidenceOrientationStrip", () => {
  it("renders Sources follow-up links and claim-discipline callout", () => {
    render(<SignedRecordsListEvidenceOrientationStrip />);

    expect(screen.getByTestId("signed-records-list-orientation")).toBeInTheDocument();
    expect(screen.getByTestId("signed-records-list-sources")).toBeInTheDocument();
    expect(screen.getByTestId("signed-records-list-claim-discipline")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Findings" })).toHaveAttribute("href", "/governance/findings");
    expect(screen.getByRole("link", { name: "Assurance status" })).toHaveAttribute(
      "href",
      "/security-trust",
    );
  });
});
