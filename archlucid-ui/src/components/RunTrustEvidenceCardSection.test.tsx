import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RunTrustEvidenceCard, TrustEvidenceFieldSnapshot } from "@/types/authority";

import { RunTrustEvidenceCardSection } from "./RunTrustEvidenceCardSection";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
  isBuyerPolishedOperatorShellEnv: vi.fn(() => false),
};
});

vi.mock("next/link", () => ({  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

const buyerPolishedMock = vi.mocked(isBuyerPolishedOperatorShellEnv);
function field(title: string, status = "Available", detail = `${title} detail`): TrustEvidenceFieldSnapshot {
  return { title, status, detail };
}

function card(overrides: Partial<RunTrustEvidenceCard> = {}): RunTrustEvidenceCard {
  return {
    selfAttestationNotice: "Operational evidence only; not a legal attestation.",
    executionMode: field("Execution mode"),
    goldenManifest: field("Golden manifest snapshot"),
    auditTrail: field("Audit trail"),
    agentTraces: field("Agent traces"),
    artifactBundlePointer: field("Persisted artifact bundle id"),
    traceabilityExport: field("Review-trail export"),
    aiExplainability: field("AI explanation citations"),
    topFinding: {
      findingId: "finding-1",
      title: "Encrypt PHI stores",
      traceCompletenessLabel: "High",
      evidencePointersSummary: "Manifest and context snapshot pointers resolved.",
    },
    links: [
      { rel: "traceabilityZip", path: "/v1/architecture/review/run-1/traceability-bundle.zip", label: "Review-trail ZIP" },
      { rel: "traces", path: "/v1/architecture/review/run-1/traces", label: "Agent execution traces" },
      { rel: "evidence", path: "/v1/architecture/review/run-1/evidence", label: "Evidence package" },
      {
        rel: "topFindingEvidenceChain",
        path: "/v1/architecture/review/run-1/findings/finding-1/evidence-chain",
        label: "Top finding evidence chain",
      },
    ],
    ...overrides,
  };
}

describe("RunTrustEvidenceCardSection", () => {
  it("renders compact evidence-to-manifest-to-audit proof chain", () => {
    render(<RunTrustEvidenceCardSection card={card()} />);

    const proofChain = screen.getByTestId("evidence-to-manifest-audit-proof-chain");

    expect(proofChain).toBeInTheDocument();
    expect(screen.getByText("Proof confidence")).toBeInTheDocument();
    expect(screen.getByText(/Evidence → finding → review record → artifact → audit proof chain/i)).toBeInTheDocument();
    expect(screen.getByText(/stronger than a free-form AI answer/i)).toBeInTheDocument();
    expect(within(proofChain).getByRole("link", { name: "Evidence package" })).toHaveAttribute(
      "href",
      "/api/proxy/v1/architecture/review/run-1/evidence",
    );
    expect(within(proofChain).getByRole("link", { name: "Top finding evidence chain" })).toHaveAttribute(
      "href",
      "/api/proxy/v1/architecture/review/run-1/findings/finding-1/evidence-chain",
    );
    expect(within(proofChain).getByRole("link", { name: "Review-trail ZIP" })).toHaveAttribute(
      "href",
      "/api/proxy/v1/architecture/review/run-1/traceability-bundle.zip",
    );
  });

  it("warns when a partial chain is missing a top finding", () => {
    render(<RunTrustEvidenceCardSection card={card({ topFinding: null, links: [] })} />);

    expect(screen.getByText(/No top finding evidence-chain pointer is available/i)).toBeInTheDocument();
    expect(screen.getAllByText(/WARN: supporting link is missing/i).length).toBeGreaterThan(0);
  });

  it("leads with a readiness verdict instead of a flat wall of status tags", () => {
    render(
      <RunTrustEvidenceCardSection
        card={card({ aiExplainability: field("AI explainability rollup", "Low confidence") })}
      />,
    );

    const verdict = screen.getByTestId("trust-evidence-readiness-verdict");

    expect(verdict).toHaveTextContent(/evidence fields need attention before sponsor handoff/i);
    expect(
      within(screen.getByTestId("trust-evidence-exception-fields")).getByText("AI explainability rollup"),
    ).toBeInTheDocument();
  });

  it("gives Proof confidence its own copy rather than repeating the execution mode detail", () => {
    render(
      <RunTrustEvidenceCardSection
        card={card({ executionMode: field("Execution mode", "Available", "Persisted label: deterministic analysis path.") })}
      />,
    );

    expect(screen.queryAllByText("Persisted label: deterministic analysis path.")).toHaveLength(1);
  });

  it("keeps identifiers and raw instants out of primary content", () => {
    render(
      <RunTrustEvidenceCardSection
        card={card({
          artifactBundlePointer: field(
            "Persisted artifact bundle id",
            "Available",
            "Bundle id db2fd94d-33df-4737-ac0e-fc38a96a2620",
          ),
          goldenManifest: field("Golden manifest snapshot", "Available", "Version 1: committed 2026-08-09T17:18:02.2700188Z"),
        })}
      />,
    );

    const proofChain = screen.getByTestId("evidence-to-manifest-audit-proof-chain");

    expect(within(proofChain).queryByText(/db2fd94d-33df-4737-ac0e-fc38a96a2620/)).not.toBeInTheDocument();
    expect(within(proofChain).queryByText(/2026-08-09T17:18:02/)).not.toBeInTheDocument();
    expect(within(proofChain).getByText(/committed 9 Aug 2026, 17:18 UTC/)).toBeInTheDocument();
    expect(within(proofChain).getByText("Artifact bundle")).toBeInTheDocument();

    const technical = screen.getByTestId("trust-evidence-technical-details");

    expect(within(technical).getByText(/db2fd94d-33df-4737-ac0e-fc38a96a2620/)).toBeInTheDocument();
  });

  it("does not present an absence finding as verified proof", () => {
    render(
      <RunTrustEvidenceCardSection
        card={card({
          topFinding: {
            findingId: "finding-topology",
            title: "No topology resources were found",
            traceCompletenessLabel: "Medium",
            evidencePointersSummary: "Manifest version v1.0.0; graph nodes: 0; linked trace ids: 3",
          },
        })}
      />,
    );

    const step = screen.getByTestId("proof-chain-step-2");

    expect(within(step).getByText("Evidence did not surface topology resources")).toBeInTheDocument();
    expect(within(step).getByText("Recorded")).toBeInTheDocument();
    expect(within(step).queryByText("Available")).not.toBeInTheDocument();
    expect(within(step).queryByText(/graph nodes: 0/)).not.toBeInTheDocument();
  });

  it("keeps the finding id and evidence pointer counts in the diagnostics disclosure", () => {
    render(
      <RunTrustEvidenceCardSection
        card={card({
          topFinding: {
            findingId: "finding-topology",
            title: "No topology resources were found",
            traceCompletenessLabel: "Medium",
            evidencePointersSummary: "Manifest version v1.0.0; graph nodes: 0; linked trace ids: 3",
          },
        })}
      />,
    );

    const technical = screen.getByTestId("trust-evidence-technical-details");

    expect(within(technical).getByText(/finding-topology/)).toBeInTheDocument();
    expect(within(technical).getByText(/graph nodes: 0/)).toBeInTheDocument();
  });

  it("buyer-polished shell maps golden manifest labels to signed review record", () => {
    buyerPolishedMock.mockReturnValue(true);

    render(<RunTrustEvidenceCardSection card={card()} />);

    expect(screen.getByText(/Step 3: Signed review record/i)).toBeInTheDocument();
    expect(screen.queryByText("Golden manifest snapshot")).not.toBeInTheDocument();
    expect(screen.queryByText(/Golden manifest snapshot detail/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Signed review record").length).toBeGreaterThanOrEqual(2);
  });
});