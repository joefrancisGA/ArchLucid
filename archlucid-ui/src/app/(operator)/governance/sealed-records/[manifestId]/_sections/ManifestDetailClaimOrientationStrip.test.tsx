import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SIGNED_RECORD_CLAIM_DISCIPLINE } from "@/lib/signed-record-evidence-copy";
import { SEALED_RECORD_DETAIL_CLAIM_HEADING } from "@/lib/sealed-record-detail-page-copy";

import { ManifestDetailClaimOrientationStrip } from "./ManifestDetailClaimOrientationStrip";

describe("ManifestDetailClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<ManifestDetailClaimOrientationStrip />);

    expect(screen.getByText(SEALED_RECORD_DETAIL_CLAIM_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("sealed-record-detail-claim-discipline").textContent).toContain(
      SIGNED_RECORD_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("sealed-record-detail-sources")).toBeInTheDocument();
  });
});
