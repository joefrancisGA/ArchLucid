using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Advisory;

/// <summary>Wave-28 suggestion 290: advisory recommendation apply fail-closed on source run sealed hash.</summary>
public static class AdvisoryApplySealedManifestHashGuard
{
    public static async Task EnsureRecommendationRunSealedOrThrowAsync(
        RecommendationRecord recommendation,
        RecommendationActionRequest request,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(recommendation);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (request.Action is not RecommendationActionType.Accept and not RecommendationActionType.MarkImplemented)
            return;

        if (recommendation.RunId == Guid.Empty)
            return;

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            recommendation.RunId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
