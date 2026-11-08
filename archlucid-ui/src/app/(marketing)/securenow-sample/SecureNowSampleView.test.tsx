import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SecureNowSampleView } from "@/app/(marketing)/securenow-sample/SecureNowSampleView";
import { metadata } from "@/app/(marketing)/securenow-sample/page";
import {
  SECURENOW_SAMPLE_FIXTURE_LINE,
  SECURENOW_SAMPLE_PATH_INSPECT_HREF,
  SECURENOW_SAMPLE_PATH_INSPECT_LABEL,
  SECURENOW_SAMPLE_WHY_LINK_LABEL,
  WHY_SECURENOW_CONVERSATION_LABEL,
  WHY_SECURENOW_DRAFT_PITCH,
} from "@/lib/marketing/securenow-sample-copy";

describe("SecureNow sample page (SN-MKT-09)", () => {
  it("renders the fixture line, pitch, and conversation link", () => {
    render(<SecureNowSampleView />);

    expect(screen.getByTestId("securenow-sample-page")).toBeInTheDocument();
    expect(screen.getByTestId("securenow-sample-fixture-line")).toHaveTextContent(
      SECURENOW_SAMPLE_FIXTURE_LINE,
    );
    expect(screen.getByTestId("securenow-sample-pitch")).toHaveTextContent(WHY_SECURENOW_DRAFT_PITCH);
    expect(screen.getByRole("link", { name: SECURENOW_SAMPLE_PATH_INSPECT_LABEL })).toHaveAttribute(
      "href",
      SECURENOW_SAMPLE_PATH_INSPECT_HREF,
    );
    expect(screen.getByRole("link", { name: WHY_SECURENOW_CONVERSATION_LABEL })).toHaveAttribute(
      "href",
      "mailto:support@archlucid.net?subject=SecureNow%20conversation",
    );
  });

  it("exports indexable metadata", () => {
    expect(metadata.robots).toEqual({ index: true, follow: true });
  });

  it("links back to Why SecureNow", () => {
    render(<SecureNowSampleView />);

    expect(screen.getByRole("link", { name: SECURENOW_SAMPLE_WHY_LINK_LABEL })).toHaveAttribute(
      "href",
      "/why-securenow",
    );
  });

  it("renders the remaining fixture beats with honest boundaries", () => {
    render(<SecureNowSampleView />);

    expect(screen.getAllByText(/not verified/i)).not.toHaveLength(0);
    expect(screen.getAllByText(/does not change Azure/i)).not.toHaveLength(0);
  });

  it("lists the public fixture hops and cut point", () => {
    render(<SecureNowSampleView />);

    expect(screen.getByTestId("securenow-sample-fixture-hops")).toHaveTextContent("fixture-path-01");
    expect(screen.getByTestId("securenow-sample-fixture-hops")).toHaveTextContent("Reader on the subscription");
    expect(screen.getByTestId("securenow-sample-fixture-hops")).toHaveTextContent("not an observed exploit");
  });

  it("lists the second synthetic fixture path section", () => {
    render(<SecureNowSampleView />);

    expect(document.getElementById("fixture-path-02")).toBeInTheDocument();
    expect(screen.getByText(/Second synthetic path \(fixture-path-02\)/)).toBeInTheDocument();
  });
});
