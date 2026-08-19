import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SponsorRoiBaselineGateNotice } from "./SponsorRoiBaselineGateNotice";

const reloadMock = vi.fn();
const completenessState = vi.hoisted(() => ({
  loading: false,
  complete: false as boolean | null,
}));

vi.mock("@/hooks/use-pilot-roi-baseline-completeness", () => ({
  usePilotRoiBaselineCompleteness: () => ({
    loading: completenessState.loading,
    complete: completenessState.complete,
    reload: reloadMock,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("SponsorRoiBaselineGateNotice", () => {
  beforeEach(() => {
    completenessState.loading = false;
    completenessState.complete = false;
    reloadMock.mockReset();
  });

  it("renders soft warning with scorecard CTA when finalized and baselines are missing", () => {
    render(<SponsorRoiBaselineGateNotice isFinalized />);

    expect(screen.getByTestId("sponsor-roi-baseline-gate-notice")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-roi-baseline-gate-capture")).toHaveAttribute(
      "href",
      "/insights/architecture-scorecard#roi-assumptions",
    );
    expect(screen.getByTestId("sponsor-roi-baseline-gate-send-anyway")).toBeInTheDocument();
  });

  it("hides when baselines are complete", () => {
    completenessState.complete = true;
    const { container } = render(<SponsorRoiBaselineGateNotice isFinalized />);

    expect(container).toBeEmptyDOMElement();
  });

  it("hides when the package is not finalized", () => {
    const { container } = render(<SponsorRoiBaselineGateNotice isFinalized={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("dismisses after Send anyway without disabling export controls elsewhere", () => {
    render(<SponsorRoiBaselineGateNotice isFinalized />);

    fireEvent.click(screen.getByTestId("sponsor-roi-baseline-gate-send-anyway"));

    expect(screen.queryByTestId("sponsor-roi-baseline-gate-notice")).not.toBeInTheDocument();
  });

  it("opens the guided baseline wizard from the secondary CTA", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    render(<SponsorRoiBaselineGateNotice isFinalized />);

    fireEvent.click(screen.getByTestId("sponsor-roi-baseline-gate-wizard"));

    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls.find(
      (call) => call[0] instanceof Event && call[0].type === "archlucid-pilot-baseline-wizard-open",
    );
    expect(event).toBeDefined();
    dispatchSpy.mockRestore();
  });
});