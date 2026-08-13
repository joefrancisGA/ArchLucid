import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { RunTraceViewerLink } from "@/components/runs/RunTraceViewerLink";

const authorityMock = vi.hoisted(() => ({
  callerAuthorityRank: 3,
  isAuthorityLoading: false,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => authorityMock,
}));

describe("RunTraceViewerLink", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    authorityMock.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;
    authorityMock.isAuthorityLoading = false;
  });

  it("renders View trace with correct href when template and traceId are set", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE",
      "https://jaeger.example.com/trace/{traceId}",
    );

    const traceId = "a1b2c3d4e5f678901234567890abcdef";

    render(<RunTraceViewerLink traceId={traceId} />);

    const link = screen.getByRole("link", { name: /view trace/i });
    expect(link).toHaveAttribute("href", `https://jaeger.example.com/trace/${traceId}`);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("does not render View trace when the env template is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE", "");

    const traceId = "a1b2c3d4e5f678901234567890abcdef";

    render(<RunTraceViewerLink traceId={traceId} />);

    expect(screen.queryByRole("link", { name: /view trace/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Support ref:\s*a1b2c3d4…/)).toBeInTheDocument();
  });

  it("returns null when traceId is null", () => {
    vi.stubEnv(
      "NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE",
      "https://jaeger.example.com/trace/{traceId}",
    );

    const { container } = render(<RunTraceViewerLink traceId={null} />);

    expect(container.firstChild).toBeNull();
  });

  it("copies the full trace id when copy is pressed", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
    });

    vi.stubEnv(
      "NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE",
      "https://jaeger.example.com/trace/{traceId}",
    );

    const traceId = "a1b2c3d4e5f678901234567890abcdef";

    render(<RunTraceViewerLink traceId={traceId} />);

    fireEvent.click(screen.getByRole("button", { name: /copy full trace id/i }));

    expect(writeText).toHaveBeenCalledWith(traceId);
  });

  it("hides View trace for non-admin operators and labels support reference", () => {
    authorityMock.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    vi.stubEnv(
      "NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE",
      "https://jaeger.example.com/trace/{traceId}",
    );

    const traceId = "a1b2c3d4e5f678901234567890abcdef";

    render(<RunTraceViewerLink traceId={traceId} />);

    expect(screen.queryByRole("link", { name: /view trace/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Support ref:/)).toBeInTheDocument();
  });
});
