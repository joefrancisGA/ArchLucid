import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { describe, expect, it } from "vitest";

import { EvidenceOrientationClaimCallout } from "@/components/evidence-orientation/EvidenceOrientationClaimCallout";
import { EVIDENCE_CLAIM_STYLE } from "@/components/evidence-orientation/evidence-orientation-styles";

describe("EvidenceOrientationClaimCallout", () => {
  it("renders a warn complementary band by default", () => {
    render(<EvidenceOrientationClaimCallout testId="scope-help-claim-discipline" body="Orientation only." />);

    const callout = screen.getByTestId("scope-help-claim-discipline");
    expect(callout.tagName).toBe("ASIDE");
    expect(callout).toHaveClass("border-amber-600/60");
    expect(callout).not.toHaveAttribute("aria-labelledby");
    expect(callout.textContent).toContain("Orientation only.");
  });

  it("renders a plain div when an ancestor already owns the complementary role", () => {
    render(
      <EvidenceOrientationClaimCallout
        testId="help-digests-claim-discipline"
        body="Digest orientation."
        element="div"
        style={EVIDENCE_CLAIM_STYLE.operatorNeutral}
      />,
    );

    const callout = screen.getByTestId("help-digests-claim-discipline");
    expect(callout.tagName).toBe("DIV");
    expect(callout).toHaveClass("text-al-text-secondary");
    expect(callout).not.toHaveClass("border-amber-600/60");
  });

  it("names the band with a visible heading and offsets the body below it", () => {
    render(
      <EvidenceOrientationClaimCallout
        testId="caiq-sig-response-help-claim-discipline"
        body="Scope sentence."
        heading={{ id: "caiq-claim-heading", text: "What this covers" }}
      />,
    );

    const callout = screen.getByTestId("caiq-sig-response-help-claim-discipline");
    expect(callout).toHaveAttribute("aria-labelledby", "caiq-claim-heading");

    const heading = screen.getByRole("heading", { name: "What this covers" });
    expect(heading).toHaveAttribute("id", "caiq-claim-heading");
    expect(heading).not.toHaveClass("sr-only");

    expect(screen.getByText("Scope sentence.")).toHaveClass("mt-2");
  });

  it("hides the heading visually while keeping it as the accessible name", () => {
    render(
      <EvidenceOrientationClaimCallout
        testId="connect-gcp-securely-help-claim-discipline"
        body="Connector orientation."
        style={EVIDENCE_CLAIM_STYLE.operatorInfo}
        heading={{ id: "gcp-claim-heading", text: "Connector setup orientation", visuallyHidden: true }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Connector setup orientation" })).toHaveClass("sr-only");
    expect(screen.getByText("Connector orientation.")).not.toHaveClass("mt-2");
  });

  it("renders inline nodes in the body and extra content below it", () => {
    render(
      <EvidenceOrientationClaimCallout
        testId="glossary-help-claim-discipline"
        body={
          <>
            {"Open "}
            <Link href="/help/findings">Findings</Link>
          </>
        }
      >
        <ul>
          <li>not a diligence package</li>
        </ul>
      </EvidenceOrientationClaimCallout>,
    );

    expect(screen.getByRole("link", { name: "Findings" })).toHaveAttribute("href", "/help/findings");
    expect(screen.getByText("not a diligence package")).toBeInTheDocument();
  });
});
