import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RunTrustEvidenceCard, TrustEvidenceFieldSnapshot } from "@/types/authority";

import { RunTrustEvidenceCardSection } from "./RunTrustEvidenceCardSection";

vi.mock("next/link", () => ({
  default: ({
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
      { rel: "traceabilityZip", path: "/v1/architecture/run/run-1/traceability-bundle.zip", label: "Review-trail ZIP" },
      { rel: "traces", path: "/v1/architecture/run/run-1/traces", label: "Agent execution traces" },
      { rel: "evidence", path: "/v1/architecture/run/run-1/evidence", label: "Evidence package" },
      {
        rel: "topFindingEvidenceChain",
        path: "/v1/architecture/run/run-1/findings/finding-1/evidence-chain",
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
    expect(screen.getByText(/Evidence → finding → manifest → artifact → audit proof chain/i)).toBeInTheDocument();
    expect(screen.getByText(/stronger than a free-form AI answer/i)).toBeInTheDocument();
    expect(within(proofChain).getByRole("link", { name: "Evidence package" })).toHaveAttribute(
      "href",
      "/api/proxy/v1/architecture/run/run-1/evidence",
    );
    expect(within(proofChain).getByRole("link", { name: "Top finding evidence chain" })).toHaveAttribute(
      "href",
      "/api/proxy/v1/architecture/run/run-1/findings/finding-1/evidence-chain",
    );
    expect(within(proofChain).getByRole("link", { name: "Review-trail ZIP" })).toHaveAttribute(
      "href",
      "/api/proxy/v1/architecture/run/run-1/traceability-bundle.zip",
    );
  });

  it("warns when a partial chain is missing a top finding", () => {
    render(<RunTrustEvidenceCardSection card={card({ topFinding: null, links: [] })} />);

    expect(screen.getByText(/No top finding evidence-chain pointer is available/i)).toBeInTheDocument();
    expect(screen.getAllByText(/WARN: supporting link is missing/i).length).toBeGreaterThan(0);
  });
});
