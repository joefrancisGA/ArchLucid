using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class TrustPublishDecision
{
    public required IReadOnlyList<SpecialistReviewFinding> PublishableFindings
    {
        get;
        init;
    }

    public required IReadOnlyList<ArchitectureRecommendation> PublishableRecommendations
    {
        get;
        init;
    }

    public required IReadOnlySet<string> IntegrityPassedFindingIds
    {
        get;
        init;
    }

    public bool PublishBlocked
    {
        get;
        init;
    }

    public List<string> BlockReasons
    {
        get;
        init;
    } = [];
}
