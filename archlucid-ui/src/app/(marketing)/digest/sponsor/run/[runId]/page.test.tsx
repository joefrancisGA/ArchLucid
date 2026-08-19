import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DIGEST_SPONSOR_COLLATERAL_TITLE } from "@/lib/marketing/digest-sponsor-page-copy";

const fetchExecDigestSponsorDeepLinkView = vi.fn();
const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("@/lib/digest/exec-digest-sponsor-deep-link-server", () => ({
  fetchExecDigestSponsorDeepLinkView: (...args: unknown[]) => fetchExecDigestSponsorDeepLinkView(...args),
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

import ExecDigestSponsorRunDeepLinkPage from "./page";

describe("ExecDigestSponsorRunDeepLinkPage (DIU)", () => {
  beforeEach(() => {
    fetchExecDigestSponsorDeepLinkView.mockReset();
    notFound.mockClear();
  });

  it("rejects invalid run ids", async () => {
    await expect(
      ExecDigestSponsorRunDeepLinkPage({
        params: Promise.resolve({ runId: "undefined" }),
        searchParams: Promise.resolve({ token: "secret" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders collateral issue shell when token is missing", async () => {
    const element = await ExecDigestSponsorRunDeepLinkPage({
      params: Promise.resolve({ runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByTestId("digest-sponsor-issue-page")).toBeInTheDocument();
    expect(screen.getByTestId("digest-sponsor-orientation-top")).toBeInTheDocument();
  });

  it("loads collateral view through shared digest panel", async () => {
    fetchExecDigestSponsorDeepLinkView.mockResolvedValue({
      target: "run-collateral",
      weekLabel: "Week of Aug 10, 2026",
      topRuns: [],
      runSummaryMarkdown: "Sponsor summary",
      signInUrl: "/auth/signin",
    });

    const element = await ExecDigestSponsorRunDeepLinkPage({
      params: Promise.resolve({ runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }),
      searchParams: Promise.resolve({ token: "secret-token" }),
    });

    render(element);

    await waitFor(() => {
      expect(screen.getByTestId("digest-sponsor-page")).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { level: 1, name: DIGEST_SPONSOR_COLLATERAL_TITLE })).toBeInTheDocument();
    expect(fetchExecDigestSponsorDeepLinkView).toHaveBeenCalledWith(
      "secret-token",
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
  });
});
