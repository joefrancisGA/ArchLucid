import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

const PEER = { href: "/peer", label: "Peer surface", testIdSuffix: "peer-link" } as const;

describe("VocabularyRail", () => {
  it("renders the compact strip with the peer link", () => {
    render(
      <VocabularyRail
        testIdPrefix="pair-vocabulary"
        currentSurfaceId="left"
        compactLine="Left is not right."
        heading="Left vs right"
        whyTwo="They answer different questions."
        currentLabel="Left surface"
        links={[PEER]}
      />,
    );

    const strip = screen.getByTestId("pair-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "left");
    expect(strip.textContent ?? "").toContain("Left is not right.");

    const peer = screen.getByTestId("pair-vocabulary-peer-link");
    expect(peer).toHaveAttribute("href", "/peer");
    expect(peer).toHaveTextContent("Peer surface");
  });

  it("invokes an optional link onClick handler", () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) => {
      event.preventDefault();
    });

    render(
      <VocabularyRail
        testIdPrefix="pair-vocabulary"
        currentSurfaceId="left"
        compactLine="Left is not right."
        heading="Left vs right"
        whyTwo="They answer different questions."
        links={[{ ...PEER, onClick }]}
      />,
    );

    fireEvent.click(screen.getByTestId("pair-vocabulary-peer-link"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("separates multiple compact links so hub rails can offer both peers", () => {
    render(
      <VocabularyRail
        testIdPrefix="pair-vocabulary"
        currentSurfaceId="hub"
        compactLine="Two channels."
        heading="Left vs right"
        whyTwo="They answer different questions."
        links={[
          { href: "/left", label: "Left", testIdSuffix: "left-link" },
          { href: "/right", label: "Right", testIdSuffix: "right-link" },
        ]}
      />,
    );

    expect(screen.getByTestId("pair-vocabulary-left-link")).toHaveAttribute("href", "/left");
    expect(screen.getByTestId("pair-vocabulary-right-link")).toHaveAttribute("href", "/right");
    expect(screen.getByTestId("pair-vocabulary").textContent ?? "").toContain("·");
  });

  it("renders the full variant with heading, why-two, notes, and current surface", () => {
    render(
      <VocabularyRail
        testIdPrefix="pair-vocabulary"
        currentSurfaceId="left"
        variant="full"
        compactLine="Left is not right."
        heading="Left vs right"
        whyTwo="They answer different questions."
        notes={[{ testIdSuffix: "honesty", text: "Estimates, not invoices." }]}
        currentLabel="Left surface"
        links={[PEER]}
      />,
    );

    const rail = screen.getByTestId("pair-vocabulary");
    expect(rail).toHaveAttribute("data-variant", "full");
    expect(rail).toHaveAttribute("aria-labelledby", "pair-vocabulary-heading");
    expect(screen.getByText("Left vs right")).toHaveAttribute("id", "pair-vocabulary-heading");
    expect(screen.getByText("They answer different questions.")).toBeInTheDocument();
    expect(screen.getByTestId("pair-vocabulary-honesty")).toHaveTextContent(
      "Estimates, not invoices.",
    );
    expect(screen.getByTestId("pair-vocabulary-current")).toHaveAttribute("aria-current", "page");
  });

  it("omits the current-surface marker on surfaces that are neither peer", () => {
    render(
      <VocabularyRail
        testIdPrefix="pair-vocabulary"
        currentSurfaceId="hub"
        variant="full"
        compactLine="Two channels."
        heading="Left vs right"
        whyTwo="They answer different questions."
        currentLabel={null}
        links={[PEER]}
      />,
    );

    expect(screen.queryByTestId("pair-vocabulary-current")).toBeNull();
  });
});
