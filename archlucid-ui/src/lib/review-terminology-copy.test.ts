import { describe, expect, it } from "vitest";

import {
  buyerFacingManifestTerminology,
  buyerFacingPersonaTerminology,
  buyerFacingReviewTerminology,
} from "@/lib/review-terminology-copy";
import { REVIEW_PACKAGE_LABEL, SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

describe("review terminology copy", () => {
  it("maps run-primary phrases to review-first vocabulary", () => {
    expect(buyerFacingReviewTerminology("Create runs from the wizard")).toBe(
      "create reviews from the wizard",
    );
    expect(buyerFacingReviewTerminology("Architecture run disposition")).toBe(
      "architecture review disposition",
    );
  });

  it("maps golden manifest jargon to Finalized review record vocabulary", () => {
    expect(buyerFacingManifestTerminology("Golden manifest snapshot")).toBe(
      `${SIGNED_MANIFEST_LABEL} snapshot`,
    );
    expect(buyerFacingManifestTerminology("Open manifest from compare")).toBe(
      `open ${REVIEW_PACKAGE_LABEL.toLowerCase()} from compare`,
    );
    expect(buyerFacingReviewTerminology("Committed manifest and finding records")).toBe(
      `finalized ${REVIEW_PACKAGE_LABEL.toLowerCase()} and finding records`,
    );
  });

  it("maps signed decision record package synonym to Finalized review record", () => {
    expect(buyerFacingManifestTerminology("Open the signed decision record")).toBe(
      `Open the ${SIGNED_MANIFEST_LABEL}`,
    );
    expect(buyerFacingReviewTerminology("Finalized decision record ready")).toBe(
      `${SIGNED_MANIFEST_LABEL} ready`,
    );
  });

  it("maps operator persona labels to architect vocabulary", () => {
    expect(buyerFacingPersonaTerminology("You need operator access to continue.")).toBe(
      "You need architect access to continue.",
    );
    expect(buyerFacingPersonaTerminology("Ask an operator to add a rule.")).toBe(
      "Ask an architect to add a rule.",
    );
    expect(buyerFacingPersonaTerminology("Writes need operator-level permission.")).toBe(
      "Writes need elevated permissions.",
    );
    expect(buyerFacingPersonaTerminology("Operators configure alert rules.")).toBe(
      "Architects configure alert rules.",
    );
  });
});
