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
        IReadOnlyList<string> CriticalJsonProperties,
        IReadOnlyList<string> ForbiddenJsonProperties);

    /// <summary>Forbidden on buyer/proof surfaces — internal snapshot ids and LLM forensics (TB-285).</summary>
    internal static readonly string[] SharedBuyerForbiddenJsonProperties =
    [
        "contextSnapshotId",
        "graphSnapshotId",
        "findingsSnapshotId",
        "decisionTraceId",
        "traceId",
        "rawResponse",
        "systemPrompt",
        "userPrompt",
        "parsedResultJson",
        "fullSystemPromptInline",
        "fullUserPromptInline",
        "fullResponseInline",
        "fullSystemPromptBlobKey",
        "fullUserPromptBlobKey",
        "fullResponseBlobKey",
    ];

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
            ],
            ForbiddenJsonProperties: SharedBuyerForbiddenJsonProperties),
        new Surface(
            OpenApiSchemaName: "SponsorRoiSummaryResponse",
            ContractType: typeof(ArchLucid.Contracts.Roi.SponsorRoiSummaryResponse),
            GeneratedClientTypeName: "SponsorRoiSummaryResponse",
            CriticalJsonProperties:
            [
                "orphanCandidates",
                "costEvidenceFreshnessStatus",
                "savingsPricingBasis",
                "totalEstimatedUsdSavings",
                "basisBreakdown",
            ],
            ForbiddenJsonProperties: SharedBuyerForbiddenJsonProperties),
        new Surface(
            OpenApiSchemaName: "SponsorOrphanCandidateSummary",
            ContractType: typeof(ArchLucid.Contracts.Roi.SponsorOrphanCandidateSummary),
            GeneratedClientTypeName: "SponsorOrphanCandidateSummary",
            CriticalJsonProperties:
            [
                "candidateCount",
                "annualSavingsUsd",
                "evidenceRunId",
            ],
            ForbiddenJsonProperties: SharedBuyerForbiddenJsonProperties),
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
            ],
            ForbiddenJsonProperties: ["systemPrompt", "rawResponse", "userPrompt", "parsedResultJson"]),
        new Surface(
            OpenApiSchemaName: "BuyerRunDetailSummaryDto",
            ContractType: typeof(ArchLucid.Contracts.Runs.BuyerRunDetailSummaryDto),
            GeneratedClientTypeName: "BuyerRunDetailSummaryDto",
            CriticalJsonProperties:
            [
                "agentExecutionLlmCostEstimate",
                "trustEvidenceCard",
                "findingCoverageSummary",
                "findingSummaries",
                "executionFlavorBuyerSummary",
                "retrievalGroundingSummary",
                "lastAgentExecutionFailure",
            ],
            ForbiddenJsonProperties:
            [
                ..SharedBuyerForbiddenJsonProperties,
                "results",
                "findingsSnapshot",
                "graphSnapshot",
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
            ],
            ForbiddenJsonProperties: SharedBuyerForbiddenJsonProperties),
    ];
}
