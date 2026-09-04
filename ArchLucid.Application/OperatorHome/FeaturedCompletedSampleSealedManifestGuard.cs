using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.OperatorHome;

/// <summary>Wave-23 suggestion 225: featured completed sample fail-closed unless run is complete with sealed <see cref="ManifestDocument.ManifestHash"/>.</summary>
public static class FeaturedCompletedSampleSealedManifestGuard
{
    public static async Task EnsureEligibleRunSealedManifestOrThrowAsync(
        RunRecord run,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!FeaturedCompletedSampleEligibility.IsEligible(run))
        {
            throw new InvalidOperationException("The selected review is not eligible for workspace sample use.");
        }

        RunDetailDto? detail =
            await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, run.RunId, cancellationToken);

        PolicyPackSimulateSealedManifestGuard.EnsureRunSealedManifestHashOrThrow(
            detail?.GoldenManifest,
            run.RunId.ToString("D"),
            manifestHashService);
    }
}
