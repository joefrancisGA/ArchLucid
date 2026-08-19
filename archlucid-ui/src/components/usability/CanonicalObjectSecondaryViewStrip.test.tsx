import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { buildCanonicalObjectSecondaryView } from "@/lib/canonical-object-home-registry";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";

describe("CanonicalObjectSecondaryViewStrip (TB-2153)", () => {
  it("renders viewing-from copy and canonical home link", () => {
    const presentation = buildCanonicalObjectSecondaryView("finding", "governanceFindingsRegister", {
      runId: "run-1",
      findingId: "finding-1",
    });

    render(<CanonicalObjectSecondaryViewStrip presentation={presentation} testId="strip-test" />);

    expect(screen.getByTestId("strip-test")).toHaveTextContent("Viewing from Findings register");
    expect(screen.getByTestId("strip-test-home-link")).toHaveAttribute(
      "href",
      getFindingDetailHref("run-1", "finding-1"),
    );
    expect(screen.getByTestId("strip-test-home-link")).toHaveTextContent("Open finding record");
  });
});
