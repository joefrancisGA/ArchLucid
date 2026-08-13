import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  isDemoRunIdEligibleForStaticFallback,
  isStaticDemoPayloadFallbackActiveForRun,
} from "@/lib/operator/operator-static-demo";
import type { TechnologyLedgerListResponse } from "@/types/technology-ledger";

/** Seeded ledger rows for showcase/static demo reviews when live GET is unavailable. */
export function tryStaticDemoTechnologyLedger(runId: string): TechnologyLedgerListResponse | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  const runIdN = effectiveRunId.replace(/-/g, "");

  return {
    runId: runIdN,
    entries: [
      {
        entryId: "demo-ledger-intake-cloud",
        runId: runIdN,
        role: "CloudPlatform",
        technologyName: "Microsoft Azure",
        providerFamily: "Azure",
        status: "Chosen",
        source: "User",
        evidenceRef: null,
        rationale: "Captured from intake target cloud.",
        isLocked: true,
        createdUtc: "2026-01-01T00:00:00.000Z",
        updatedUtc: "2026-01-01T00:00:00.000Z",
      },
      {
        entryId: "demo-ledger-agent-datastore",
        runId: runIdN,
        role: "PrimaryDatastore",
        technologyName: "Azure SQL Database",
        providerFamily: "Azure",
        status: "Assumed",
        source: "AgentProposed",
        evidenceRef: "agentTopologyProposal:demo:ds-1",
        rationale: "Proposed by the architecture-structure assessment.",
        isLocked: false,
        createdUtc: "2026-01-01T00:00:00.000Z",
        updatedUtc: "2026-01-01T00:00:00.000Z",
      },
      {
        entryId: "demo-ledger-evidence-identity",
        runId: runIdN,
        role: "IdentityProvider",
        technologyName: "Microsoft Entra ID",
        providerFamily: "Azure",
        status: "Chosen",
        source: "Evidence",
        evidenceRef: "iac:azurerm_user_assigned_identity.demo",
        rationale: null,
        isLocked: false,
        createdUtc: "2026-01-01T00:00:00.000Z",
        updatedUtc: "2026-01-01T00:00:00.000Z",
      },
    ],
  };
}
