import { describe, expect, it } from "vitest";

import type { components } from "@/lib/openapi-schemas";
import openApiSnapshot from "../../../ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json";

/**
 * Maps exported UI domain types to their OpenAPI `components.schemas` keys.
 * Update when adding new aliases under `src/types/`.
 */
export const UI_TYPE_OPENAPI_SCHEMA_KEYS = {
  DiffItem: "DiffItemResponse",
  ManifestComparison: "ManifestComparisonResponse",
  RunComparison: "RunComparisonResponse",
  ReplayResponse: "ReplayResponse",
  ReplayValidation: "ReplayValidationResponse",
  ProvenanceNode: "ProvenanceNode",
  ProvenanceEdge: "ProvenanceEdge",
  DecisionProvenanceGraph: "DecisionProvenanceGraph",
  PipelineTimelineItem: "RunPipelineTimelineItemResponse",
  RunSummary: "RunSummaryResponse",
  ManifestSummary: "ManifestSummaryResponse",
  ArtifactDescriptor: "ArtifactDescriptorResponse",
  RunAgentExecutionLlmCostEstimate: "RunAgentLlmCostEstimateResponse",
  RunDetailAgentResult: "AgentResult",
  PilotFunnelSnapshotDto: "PilotFunnelSnapshotResponse",
  OperatorStickinessSnapshotDto: "OperatorStickinessSnapshotResponse",
  ConnectorSurfaceStatusDto: "ConnectorSurfaceStatusResponse",
  IntegrationEventBusStatusDto: "IntegrationEventBusStatusResponse",
  TenantIntegrationsOperationsDto: "TenantIntegrationsOperationsResponse",
  WeeklyDigestHealthDto: "WeeklyDigestHealthResponse",
  AlertActionLoopDto: "AlertActionLoopResponse",
  AlertDeliveryAttemptDto: "AlertDeliveryAttemptResponse",
  TechnologyLedgerRole: "TechnologyLedgerRole",
  TechnologyLedgerStatus: "TechnologyLedgerStatus",
  TechnologyLedgerSource: "TechnologyLedgerSource",
  CloudProviderFamily: "CloudProvider",
  TechnologyLedgerEntry: "TechnologyLedgerEntryResponse",
  TechnologyLedgerListResponse: "TechnologyLedgerListResponse",
  PatchTechnologyLedgerEntryRequest: "PatchTechnologyLedgerEntryRequest",
  PatchTechnologyLedgerEntryResponse: "PatchTechnologyLedgerEntryResponse",
} as const satisfies Record<string, keyof components["schemas"]>;

type AssertExtends<Base, Derived extends Base> = Derived;

/** Compile-time guard: aliased DTOs remain assignable to their OpenAPI wire shapes. */
type _AuthorityAliases = [
  AssertExtends<components["schemas"]["DiffItemResponse"], import("@/types/authority").DiffItem>,
  AssertExtends<components["schemas"]["ManifestComparisonResponse"], import("@/types/authority").ManifestComparison>,
  AssertExtends<components["schemas"]["RunComparisonResponse"], import("@/types/authority").RunComparison>,
  AssertExtends<components["schemas"]["ReplayValidationResponse"], import("@/types/authority").ReplayValidation>,
  AssertExtends<components["schemas"]["ReplayResponse"], import("@/types/authority").ReplayResponse>,
  AssertExtends<components["schemas"]["ProvenanceNode"], import("@/types/authority").ProvenanceNode>,
  AssertExtends<components["schemas"]["ProvenanceEdge"], import("@/types/authority").ProvenanceEdge>,
  AssertExtends<
    components["schemas"]["DecisionProvenanceGraph"],
    import("@/types/authority").DecisionProvenanceGraph
  >,
  AssertExtends<
    components["schemas"]["RunPipelineTimelineItemResponse"],
    import("@/types/authority").PipelineTimelineItem
  >,
];

type _OperateRhythmAliases = [
  AssertExtends<
    components["schemas"]["PilotFunnelSnapshotResponse"],
    import("@/types/operate-rhythm").PilotFunnelSnapshotDto
  >,
  AssertExtends<
    components["schemas"]["OperatorStickinessSnapshotResponse"],
    import("@/types/operate-rhythm").OperatorStickinessSnapshotDto
  >,
  AssertExtends<
    components["schemas"]["ConnectorSurfaceStatusResponse"],
    import("@/types/operate-rhythm").ConnectorSurfaceStatusDto
  >,
  AssertExtends<
    components["schemas"]["IntegrationEventBusStatusResponse"],
    import("@/types/operate-rhythm").IntegrationEventBusStatusDto
  >,
  AssertExtends<
    components["schemas"]["TenantIntegrationsOperationsResponse"],
    import("@/types/operate-rhythm").TenantIntegrationsOperationsDto
  >,
  AssertExtends<
    components["schemas"]["WeeklyDigestHealthResponse"],
    import("@/types/operate-rhythm").WeeklyDigestHealthDto
  >,
  AssertExtends<
    components["schemas"]["AlertActionLoopResponse"],
    import("@/types/operate-rhythm").AlertActionLoopDto
  >,
  AssertExtends<
    components["schemas"]["AlertDeliveryAttemptResponse"],
    import("@/types/operate-rhythm").AlertDeliveryAttemptDto
  >,
];

type _TechnologyLedgerAliases = [
  AssertExtends<components["schemas"]["TechnologyLedgerRole"], import("@/types/technology-ledger").TechnologyLedgerRole>,
  AssertExtends<
    components["schemas"]["TechnologyLedgerStatus"],
    import("@/types/technology-ledger").TechnologyLedgerStatus
  >,
  AssertExtends<
    components["schemas"]["TechnologyLedgerSource"],
    import("@/types/technology-ledger").TechnologyLedgerSource
  >,
  AssertExtends<components["schemas"]["CloudProvider"], import("@/types/technology-ledger").CloudProviderFamily>,
  AssertExtends<
    components["schemas"]["TechnologyLedgerEntryResponse"],
    import("@/types/technology-ledger").TechnologyLedgerEntry
  >,
  AssertExtends<
    components["schemas"]["TechnologyLedgerListResponse"],
    import("@/types/technology-ledger").TechnologyLedgerListResponse
  >,
  AssertExtends<
    components["schemas"]["PatchTechnologyLedgerEntryRequest"],
    import("@/types/technology-ledger").PatchTechnologyLedgerEntryRequest
  >,
  AssertExtends<
    components["schemas"]["PatchTechnologyLedgerEntryResponse"],
    import("@/types/technology-ledger").PatchTechnologyLedgerEntryResponse
  >,
];

// Touch compile-time alias checks so unused-type pruning does not drop them.
const _compileTimeAliasGuards: [_AuthorityAliases, _OperateRhythmAliases, _TechnologyLedgerAliases] = [
  [] as unknown as _AuthorityAliases,
  [] as unknown as _OperateRhythmAliases,
  [] as unknown as _TechnologyLedgerAliases,
];
void _compileTimeAliasGuards;

describe("openapi type alias schema keys", () => {
  const snapshotSchemaKeys = new Set(Object.keys(openApiSnapshot.components.schemas));

  it("maps each aliased UI type to an existing OpenAPI components schema key", () => {
    for (const [uiType, schemaKey] of Object.entries(UI_TYPE_OPENAPI_SCHEMA_KEYS)) {
      expect(snapshotSchemaKeys.has(schemaKey), `${uiType} → ${schemaKey}`).toBe(true);
    }
  });

  it("keeps the mapping table in sync with the number of guarded aliases", () => {
    expect(Object.keys(UI_TYPE_OPENAPI_SCHEMA_KEYS)).toHaveLength(30);
  });
});
