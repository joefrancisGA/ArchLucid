using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

/// <summary>Synthetic verified input for tests that assert concrete recommendations and trade-offs.</summary>
internal static class RecommendationTestEvidence
{
    internal static ClaimProvenance DirectlyEstablished() => new()
    {
        Origin = ClaimOrigin.DirectlyExtracted,
        SupportStatus = SupportStatus.DirectlyEstablished,
        SourceArtifactId = "synthetic-review-evidence",
    };
}
