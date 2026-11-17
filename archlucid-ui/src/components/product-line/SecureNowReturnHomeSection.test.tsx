import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { writeSecureNowPinnedPathId } from "@/lib/product-line/securenow-stickiness";
import { fetchSecurityEvidencePathAttackPathReport } from "@/lib/security-evidence-path-api";

import { SecureNowReturnHomeSection } from "./SecureNowReturnHomeSection";

const scope = { tenantId: "tenant-1", workspaceId: "workspace-1", projectId: "project-1" };

vi.mock("@/hooks/use-operator-scope-query-key", () => ({ useOperatorScopeQueryKey: () => scope }));
vi.mock("@/hooks/use-securenow-collection-setup-input", () => ({
  useSecureNowCollectionSetupInput: () => ({ collectionInput: null }),
}));
vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: async () => ({
    items: ["latest", "previous"].map((snapshotId) => ({ snapshotId, captureStatus: "Succeeded" })),
  }),
}));
vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationInstances: async () => [],
}));
vi.mock("@/lib/security-evidence-path-api", () => ({
  fetchRankedSecurityEvidencePaths: async () => ({ items: [] }),
  fetchSecurityEvidencePathAttackPathReport: vi.fn(),
}));

describe("SecureNowReturnHomeSection", () => {
  afterEach(() => window.localStorage.clear());

  it.each([
    { outcome: "failed request", comparisonAvailable: false },
    { outcome: "unavailable report", comparisonAvailable: false },
    { outcome: "successful empty report", comparisonAvailable: true },
  ])(
    "requires comparable evidence to mark a watched path gone ($outcome)",
    async ({ outcome, comparisonAvailable }) => {
      writeSecureNowPinnedPathId(scope, "watched-path");
      vi.mocked(fetchSecurityEvidencePathAttackPathReport).mockImplementation(async (snapshotId) => {
        if (snapshotId === "previous") {
          return {
            snapshotId,
            vulnerableAttackPaths: [],
            unevaluatedGroups: [{
              reasonCode: "unknown",
              whyText: "Insufficient evidence",
              pathCount: 1,
              pathIds: ["watched-path"],
              engineName: null,
              limitValue: null,
              pathsEmitted: null,
            }],
          };
        }
        if (outcome === "failed request") {
          throw new Error("Report request failed");
        }
        return comparisonAvailable ? { snapshotId, vulnerableAttackPaths: [], unevaluatedGroups: [] } : null;
      });

      const client = new QueryClient();
      render(
        <QueryClientProvider client={client}>
          <SecureNowReturnHomeSection />
        </QueryClientProvider>,
      );

      expect(await screen.findByRole("link", { name: "Latest capture on this workspace" })).toBeInTheDocument();
      expect(screen.queryByText(/watched-path is gone/) !== null).toBe(comparisonAvailable);
      expect(screen.queryByRole("link", { name: "Recent changes" }) !== null).toBe(comparisonAvailable);
    },
  );
});
