namespace ArchLucid.Api.Tests.Contracts;

/// <summary>
///     Critical proof/ROI DTO properties guarded by <see cref="ProofSurfaceContractDriftTests" /> (assessment #9).
///     Regenerate clients when intentional:
///     dotnet build ArchLucid.Api.Client/ArchLucid.Api.Client.csproj;
///     cd archlucid-ui; npm run generate:api-types
/// </summary>
internal static class ProofSurfaceContractRegistry
{
    internal sealed record Surface(
        string OpenApiSchemaName,
        Type ContractType,
        string GeneratedClientTypeName,
        IReadOnlyList<string> CriticalJsonProperties);

    internal static IReadOnlyList<Surface> Surfaces { get; } =
    [
        new Surface(
            OpenApiSchemaName: "PilotRunDeltasResponse",
            ContractType: typeof(ArchLucid.Contracts.Pilots.PilotRunDeltasResponse),
            GeneratedClientTypeName: "PilotRunDeltasResponse",
            CriticalJsonProperties:
            [
                "proofPackageCompleteness",
                "roiMetricSources",
                "estimatedUsdSavings",
                "topFindingEvidenceChain",
                "llmCallCountResolved",
                "roiSourceFreshnessDisposition",
            ]),
        new Surface(
            OpenApiSchemaName: "ExecutiveRoiSummaryResponse",
            ContractType: typeof(ArchLucid.Contracts.Roi.ExecutiveRoiSummaryResponse),
            GeneratedClientTypeName: "ExecutiveRoiSummaryResponse",
            CriticalJsonProperties:
            [
                "orphanCandidates",
                "costEvidenceFreshnessStatus",
                "savingsPricingBasis",
                "totalEstimatedUsdSavings",
                "basisBreakdown",
            ]),
        new Surface(
            OpenApiSchemaName: "ExecutiveOrphanCandidateSummary",
            ContractType: typeof(ArchLucid.Contracts.Roi.ExecutiveOrphanCandidateSummary),
            GeneratedClientTypeName: "ExecutiveOrphanCandidateSummary",
            CriticalJsonProperties:
            [
                "candidateCount",
                "annualSavingsUsd",
                "evidenceRunId",
            ]),
        new Surface(
            OpenApiSchemaName: "RunDetailDto",
            ContractType: typeof(ArchLucid.Persistence.Queries.RunDetailDto),
            GeneratedClientTypeName: "RunDetailDto",
            CriticalJsonProperties:
            [
                "agentExecutionLlmCostEstimate",
                "trustEvidenceCard",
                "findingCoverageSummary",
                "executionFlavorBuyerSummary",
                "retrievalGroundingSummary",
                "lastAgentExecutionFailure",
            ]),
        new Surface(
            OpenApiSchemaName: "RunExplanationSummary",
            ContractType: typeof(ArchLucid.Core.Explanation.RunExplanationSummary),
            GeneratedClientTypeName: "RunExplanationSummary",
            CriticalJsonProperties:
            [
                "faithfulnessSupportRatio",
                "deterministicFallbackUsed",
                "faithfulnessWarning",
                "citations",
            ]),
    ];
}
