import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return {
    ...actual,
    downloadFirstValueReportPdf: vi.fn(),
  };
});

vi.mock("@/lib/sponsor-banner-telemetry", () => ({
  recordSponsorBannerFirstCommitBadge: vi.fn(),
}));

import { downloadFirstValueReportPdf } from "@/lib/api";
import { recordSponsorBannerFirstCommitBadge } from "@/lib/sponsor-banner-telemetry";

import { EmailRunToSponsorBanner } from "./EmailRunToSponsorBanner";

const mockDownload = vi.mocked(downloadFirstValueReportPdf);
const mockTelemetry = vi.mocked(recordSponsorBannerFirstCommitBadge);

const bannerProps = { runId: "run-42", manifestId: "manifest-fixture" } as const;

function stubFetchForBannerMocks(init?: {
  readonly trialFirstCommitUtc?: string | null;
  readonly deltasBody?: unknown;
  readonly deltasOk?: boolean;
  readonly roiBaselineComplete?: boolean;
}): void {
  const trialUtc = init?.trialFirstCommitUtc ?? null;
  const deltasOk = init?.deltasOk ?? true;
  const roiBaselinePayload =
    init?.roiBaselineComplete === false
      ? { baselineReviewCycleHours: null, manualPrepHoursPerReview: null }
      : { baselineReviewCycleHours: 40, manualPrepHoursPerReview: 8 };
  const deltasBody =
    init?.deltasBody ??
    ({
      isDemoTenant: false,
      proofPackageCompleteness: {
        demoTenantWarningRequired: false,
        sponsorProofReadiness: "Sendable",
        proofSendability: "Sendable",
        publishingTier: "Complete",
        roiEvidenceConfidence: "Strong",
      },
    } as const);

  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/v1/tenant/trial-status")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ firstCommitUtc: trialUtc }),
        } as Response);
      }

      if (url.includes("/v1/tenant/baseline")) {
        return Promise.resolve({
          ok: true,
          json: async () => roiBaselinePayload,
        } as Response);
      }

      if (url.includes("/pilot-run-deltas")) {
        return Promise.resolve({
          ok: deltasOk,
          json: async () => deltasBody,
        } as Response);
      }

      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    }),
  );
}

describe("EmailRunToSponsorBanner", () => {
  beforeEach(() => {
    stubFetchForBannerMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("renders persisted proof readiness for sendable non-demo deltas", async () => {
    render(<EmailRunToSponsorBanner {...bannerProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("email-run-to-sponsor-readiness")).toBeInTheDocument();
    });

    expect(screen.getByTestId("email-run-to-sponsor-readiness")).toHaveAttribute("data-readiness-variant", "ready");
    expect(screen.getByTestId("email-run-to-sponsor-readiness")).toHaveAttribute(
      "data-readiness-classification",
      "Sendable",
    );
  });

  it("renders blocked readiness for demo-flagged completeness", async () => {
    stubFetchForBannerMocks({
      deltasBody: {
        isDemoTenant: false,
        proofPackageCompleteness: {
          demoTenantWarningRequired: true,
          sponsorProofReadiness: "DemoOnly",
          proofSendability: "Sendable",
          roiEvidenceConfidence: "Strong",
        },
      },
    });

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("email-run-to-sponsor-readiness")).toBeInTheDocument();
    });

    expect(screen.getByTestId("email-run-to-sponsor-readiness")).toHaveAttribute("data-readiness-variant", "blocked");
    expect(screen.getByTestId("email-run-to-sponsor-readiness")).toHaveAttribute(
      "data-readiness-classification",
      "DemoOnly",
    );
  });

  it("uses sample-static readiness line when curatedSampleRun is set (no loading ellipsis)", async () => {
    let resolveDeltas: ((body: unknown) => void) | null = null;
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/v1/tenant/trial-status")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ firstCommitUtc: null }),
        } as Response);
      }

      if (url.includes("/v1/tenant/baseline")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ baselineReviewCycleHours: 40, manualPrepHoursPerReview: 8 }),
        } as Response);
      }

      if (url.includes("/pilot-run-deltas")) {
        return new Promise<Response>((resolve) => {
          resolveDeltas = (body: unknown) => {
            resolve({
              ok: true,
              json: async () => body,
            } as Response);
          };
        });
      }

      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });

    render(<EmailRunToSponsorBanner {...bannerProps} curatedSampleRun />);

    expect(await screen.findByTestId("email-run-to-sponsor-readiness-sample-static")).toBeInTheDocument();
    expect(screen.queryByTestId("email-run-to-sponsor-readiness-loading")).toBeNull();

    resolveDeltas?.({
      isDemoTenant: false,
      proofPackageCompleteness: {
        demoTenantWarningRequired: false,
        sponsorProofReadiness: "Sendable",
        proofSendability: "Sendable",
        publishingTier: "Complete",
        roiEvidenceConfidence: "Strong",
      },
    });

    await waitFor(() => {
      expect(screen.getByTestId("email-run-to-sponsor-readiness")).toBeInTheDocument();
    });
  });

  it("renders the sponsor distribution heading and primary scorecard CTA", async () => {
    render(<EmailRunToSponsorBanner {...bannerProps} />);

    expect(screen.getByTestId("email-run-to-sponsor-banner")).toBeInTheDocument();
    expect(screen.getByText(/downstream deliverable|sponsor distribution/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create sponsor scorecard|generate pilot scorecard package/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
  });

  it("invokes downloadFirstValueReportPdf with the run id when the primary action is clicked", async () => {
    mockDownload.mockResolvedValue(undefined);

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    fireEvent.click(screen.getByTestId("email-run-to-sponsor-primary-action"));

    await waitFor(() => {
      expect(mockDownload).toHaveBeenCalledWith("run-42");
    });
  });

  it("exposes canonical export links without duplicating download handlers", () => {
    render(<EmailRunToSponsorBanner {...bannerProps} />);

    const md = screen.getByRole("link", {
      name: /executive value summary \(markdown\)|first-value report \(markdown\)/i,
    });

    expect(md).toHaveAttribute("href", "/api/proxy/v1/pilots/runs/run-42/first-value-report");

    const docx = screen.getByRole("link", {
      name: /architecture decision package \(docx\)|architecture package \(docx\)/i,
    });

    expect(docx.getAttribute("href")).toContain("/api/proxy/v1/docx/runs/run-42/architecture-package");

    const bundle = screen.getByRole("link", { name: /manifest bundle \(zip\)/i });

    expect(bundle.getAttribute("href")).toContain("/api/proxy/v1/artifacts/manifests/manifest-fixture/bundle");
  });

  it("renders the API problem callout when the download throws a generic error", async () => {
    mockDownload.mockRejectedValueOnce(new Error("boom — server unavailable"));

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    fireEvent.click(screen.getByTestId("email-run-to-sponsor-primary-action"));

    await waitFor(() => {
      expect(screen.getByText(/boom — server unavailable/i)).toBeInTheDocument();
    });
  });

  it("disables the button while busy", async () => {
    let resolve: (() => void) | null = null;
    mockDownload.mockReturnValueOnce(
      new Promise<void>((r) => {
        resolve = r;
      }),
    );

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    fireEvent.click(screen.getByTestId("email-run-to-sponsor-primary-action"));

    const button = screen.getByTestId("email-run-to-sponsor-primary-action") as HTMLButtonElement;

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/preparing pdf/i);

    resolve?.();
    await waitFor(() => {
      expect(screen.getByTestId("email-run-to-sponsor-primary-action")).not.toBeDisabled();
    });
  });

  it("renders Day 0 when first commit is within the first UTC day (fake timers)", async () => {
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-10T14:00:00.000Z"));
    const anchorIso = new Date("2026-03-10T12:00:00.000Z").toISOString();
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/v1/tenant/trial-status")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ firstCommitUtc: anchorIso }),
        } as Response);
      }

      if (url.includes("/v1/tenant/baseline")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ baselineReviewCycleHours: 40, manualPrepHoursPerReview: 8 }),
        } as Response);
      }

      if (url.includes("/pilot-run-deltas")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            isDemoTenant: false,
            proofPackageCompleteness: {
              demoTenantWarningRequired: false,
              proofSendability: "Sendable",
              roiEvidenceConfidence: "Strong",
            },
          }),
        } as Response);
      }

      return Promise.reject(new Error(`unexpected fetch ${url}`));
    });

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("email-run-to-sponsor-first-commit-badge")).toHaveTextContent(
        "Day 0 since first finalization",
      );
    });

    expect(mockTelemetry).toHaveBeenCalledWith(0);
  });

  it("renders Day 1 once 24h elapsed since first commit (fake timers)", async () => {
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-03-11T12:00:01.000Z"));
    const anchorIso = new Date("2026-03-10T12:00:00.000Z").toISOString();
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/v1/tenant/trial-status")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ firstCommitUtc: anchorIso }),
        } as Response);
      }

      if (url.includes("/v1/tenant/baseline")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ baselineReviewCycleHours: 40, manualPrepHoursPerReview: 8 }),
        } as Response);
      }

      if (url.includes("/pilot-run-deltas")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            isDemoTenant: false,
            proofPackageCompleteness: {
              demoTenantWarningRequired: false,
              proofSendability: "Sendable",
              roiEvidenceConfidence: "Strong",
            },
          }),
        } as Response);
      }

      return Promise.reject(new Error(`unexpected fetch ${url}`));
    });

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("email-run-to-sponsor-first-commit-badge")).toHaveTextContent(
        "Day 1 since first finalization",
      );
    });

    expect(mockTelemetry).toHaveBeenCalledWith(1);
  });

  it("renders Day 4 badge when firstCommitUtc is four and a half UTC-day periods earlier", async () => {
    const nowMs = Date.now();
    const anchorIso = new Date(nowMs - 4.5 * 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/v1/tenant/trial-status")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ firstCommitUtc: anchorIso }),
        } as Response);
      }

      if (url.includes("/v1/tenant/baseline")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ baselineReviewCycleHours: 40, manualPrepHoursPerReview: 8 }),
        } as Response);
      }

      if (url.includes("/pilot-run-deltas")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            isDemoTenant: false,
            proofPackageCompleteness: {
              demoTenantWarningRequired: false,
              proofSendability: "Sendable",
              roiEvidenceConfidence: "Strong",
            },
          }),
        } as Response);
      }

      return Promise.reject(new Error(`unexpected fetch ${url}`));
    });

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("email-run-to-sponsor-first-commit-badge")).toHaveTextContent(
        "Day 4 since first finalization",
      );
    });

    expect(mockTelemetry).toHaveBeenCalledWith(4);
  });

  it("hides the badge when firstCommitUtc is null", async () => {
    stubFetchForBannerMocks({ trialFirstCommitUtc: null });

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("email-run-to-sponsor-first-commit-badge")).toBeNull();
    expect(mockTelemetry).not.toHaveBeenCalled();
  });

  it("blocks sponsor PDF export when tenant ROI baseline posture is incomplete", async () => {
    stubFetchForBannerMocks({ roiBaselineComplete: false });

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("email-run-to-sponsor-roi-baseline-gap")).toBeInTheDocument();
    });

    expect(screen.getByTestId("email-run-to-sponsor-primary-action")).toBeDisabled();
  });

  it("hides the badge when trial-status returns 5xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("/v1/tenant/trial-status")) {
          return Promise.resolve({
            ok: false,
            status: 503,
            json: async () => ({}),
          } as Response);
        }

        if (url.includes("/v1/tenant/baseline")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ baselineReviewCycleHours: 40, manualPrepHoursPerReview: 8 }),
          } as Response);
        }

        if (url.includes("/pilot-run-deltas")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              isDemoTenant: false,
              proofPackageCompleteness: {
                demoTenantWarningRequired: false,
                proofSendability: "Sendable",
                roiEvidenceConfidence: "Strong",
              },
            }),
          } as Response);
        }

        return Promise.reject(new Error(`unexpected fetch: ${url}`));
      }),
    );

    render(<EmailRunToSponsorBanner {...bannerProps} />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("email-run-to-sponsor-first-commit-badge")).toBeNull();
    expect(mockTelemetry).not.toHaveBeenCalled();
  });

  it("shows a direct sponsor DOCX download when the committed manifest includes architecture-review-board", async () => {
    render(<EmailRunToSponsorBanner {...bannerProps} sponsorDocxAvailable />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    const sponsorDocx = screen.getByTestId("email-run-to-sponsor-sponsor-docx");
    expect(sponsorDocx).toHaveAttribute(
      "href",
      "/api/proxy/v1/artifacts/manifests/manifest-fixture/artifact/architecture-review-board",
    );
    expect(sponsorDocx).toHaveTextContent("Download Sponsor Export (DOCX)");
  });

  it("hides the direct sponsor DOCX download when no architecture-review-board artifact is present", async () => {
    render(<EmailRunToSponsorBanner {...bannerProps} sponsorDocxAvailable={false} />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });

    expect(screen.queryByTestId("email-run-to-sponsor-sponsor-docx")).toBeNull();
  });
});
