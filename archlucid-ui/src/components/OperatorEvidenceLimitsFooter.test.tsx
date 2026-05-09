import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const demoUiEnvMock = vi.hoisted(() => ({
  buyerPolishedShell: false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => demoUiEnvMock.buyerPolishedShell,
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

import { OperatorEvidenceLimitsFooter } from "./OperatorEvidenceLimitsFooter";

describe("OperatorEvidenceLimitsFooter", () => {
  it("always exposes provenance and aggregate explain links as readable anchors", () => {
    render(<OperatorEvidenceLimitsFooter runId="abc-123" />);

    expect(screen.getByTestId("operator-evidence-limits-footer")).toBeInTheDocument();

    const provenance = screen.getByRole("link", { name: /review trail \(provenance graph\)/i });

    expect(provenance).toHaveAttribute("href", "/reviews/abc-123/provenance");

    const explain = screen.getByRole("link", { name: /architecture review summary \(explain aggregate\)/i });

    expect(explain).toHaveAttribute("href", "/reviews/abc-123#run-explanation");
  });

  it("adds finding inspect link when finding id is provided", () => {
    render(<OperatorEvidenceLimitsFooter runId="run-z" findingIdForInspectLink="fid-9" />);

    const inspect = screen.getByRole("link", { name: /technical inspection trail/i });

    expect(inspect).toHaveAttribute("href", "/reviews/run-z/findings/fid-9/inspect");
  });

  it("shows fallback disclaimer only when API flag realModeFellBackToSimulator is true", () => {
    const { rerender } = render(
      <OperatorEvidenceLimitsFooter runId="r1" execution={{ realModeFellBackToSimulator: false }} />,
    );

    expect(screen.queryByTestId("operator-evidence-limits-fallback-disclaimer")).not.toBeInTheDocument();

    rerender(<OperatorEvidenceLimitsFooter runId="r1" execution={{}} />);

    expect(screen.queryByTestId("operator-evidence-limits-fallback-disclaimer")).not.toBeInTheDocument();

    rerender(
      <OperatorEvidenceLimitsFooter
        runId="r1"
        execution={{
          realModeFellBackToSimulator: true,
          pilotAoaiDeploymentSnapshot: "gpt-test",
        }}
      />,
    );

    expect(screen.getByTestId("operator-evidence-limits-fallback-disclaimer")).toHaveTextContent(
      /real-mode fallback/i,
    );
    expect(screen.getByTestId("operator-evidence-limits-fallback-disclaimer")).toHaveTextContent("gpt-test");
  });

  it("lists inspect metadata only when model deployment or prompt version strings are present", () => {
    const { rerender } = render(<OperatorEvidenceLimitsFooter runId="r1" inspectMetadata={{}} />);

    expect(screen.queryByTestId("operator-evidence-limits-inspect-metadata")).not.toBeInTheDocument();

    rerender(
      <OperatorEvidenceLimitsFooter
        runId="r1"
        inspectMetadata={{ modelDeploymentName: "dep-a", promptTemplateVersion: null }}
      />,
    );

    expect(screen.getByTestId("operator-evidence-limits-inspect-metadata")).toHaveTextContent(/dep-a/);

    rerender(
      <OperatorEvidenceLimitsFooter runId="r1" inspectMetadata={{ modelDeploymentName: "", promptTemplateVersion: "v3" }} />,
    );

    expect(screen.getByTestId("operator-evidence-limits-inspect-metadata")).toHaveTextContent(/v3/);
  });
});

describe("OperatorEvidenceLimitsFooter — buyer-polished operator shell", () => {
  beforeEach(() => {
    demoUiEnvMock.buyerPolishedShell = true;
  });

  afterEach(() => {
    demoUiEnvMock.buyerPolishedShell = false;
  });

  it("hides internal fallback and inspect disclosure copy but keeps evidence deep links", () => {
    render(
      <OperatorEvidenceLimitsFooter
        runId="demo-run"
        findingIdForInspectLink="f-1"
        execution={{
          realModeFellBackToSimulator: true,
          pilotAoaiDeploymentSnapshot: "gpt-4o-2024-05-13",
        }}
        inspectMetadata={{
          modelDeploymentName: "gpt-4o-internal",
          promptTemplateVersion: "finding-inspect-v12",
        }}
      />,
    );

    expect(screen.queryByTestId("operator-evidence-limits-fallback-disclaimer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("operator-evidence-limits-inspect-metadata")).not.toBeInTheDocument();

    const text = screen.getByTestId("operator-evidence-limits-footer").textContent ?? "";

    const forbidden = [
      "realModeFellBackToSimulator",
      "Inspect API returned",
      "model deployment name",
      "prompt template version",
      "Live cloud model execution did not complete",
    ];

    for (const fragment of forbidden) {
      expect(text).not.toContain(fragment);
    }

    expect(text).not.toContain("gpt-4o-2024-05-13");
    expect(text).not.toContain("gpt-4o-internal");
    expect(text).not.toContain("finding-inspect-v12");

    expect(screen.getByRole("link", { name: /review trail \(provenance graph\)/i })).toHaveAttribute(
      "href",
      "/reviews/demo-run/provenance",
    );
    expect(screen.getByRole("link", { name: /architecture review summary/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /technical inspection trail/i })).toHaveAttribute(
      "href",
      "/reviews/demo-run/findings/f-1/inspect",
    );
  });
});
