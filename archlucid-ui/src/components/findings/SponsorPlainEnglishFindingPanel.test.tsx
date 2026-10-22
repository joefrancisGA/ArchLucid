import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorPlainEnglishFindingPanel } from "@/components/findings/SponsorPlainEnglishFindingPanel";
import { SPONSOR_PLAIN_ENGLISH_CAUTION } from "@/lib/sponsor-plain-english-finding";

describe("SponsorPlainEnglishFindingPanel (TB-2192)", () => {
  it("renders collapsed disclosure by default and expands plain English", () => {
    render(
      <SponsorPlainEnglishFindingPanel
        input={{
          title: "Public ingress",
          message: "Ingress is exposed to the public internet.",
          severity: "High",
        }}
      />,
    );

    const root = screen.getByTestId("sponsor-plain-english-finding");
    expect(root).toBeInTheDocument();
    expect(root.tagName.toLowerCase()).toBe("details");
    expect(screen.getByText("Explain for a sponsor")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Explain for a sponsor"));

    expect(screen.getByTestId("sponsor-plain-english-finding-body")).toBeInTheDocument();
    expect(screen.getByText(/High finding: Public ingress/)).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-plain-english-finding-caution")).toHaveTextContent(
      SPONSOR_PLAIN_ENGLISH_CAUTION,
    );
  });

  it("renders always-visible block when collapsedByDefault is false", () => {
    render(
      <SponsorPlainEnglishFindingPanel
        collapsedByDefault={false}
        input={{
          title: "Missing private endpoint",
          message: "Storage account lacks a private endpoint.",
          severity: "Medium",
        }}
      />,
    );

    const root = screen.getByTestId("sponsor-plain-english-finding");
    expect(root.tagName.toLowerCase()).toBe("section");
    expect(screen.getByTestId("sponsor-plain-english-finding-body")).toBeInTheDocument();
    expect(screen.getByText(/planning-priority/)).toBeInTheDocument();
  });
});
