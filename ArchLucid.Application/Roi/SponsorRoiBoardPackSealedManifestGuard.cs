using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Roi;

/// <summary>Wave-25 suggestion 244: sponsor ROI board-pack export fail-closed on sealed hash for contributing runs.</summary>
public static class SponsorRoiBoardPackSealedManifestGuard
{
    public static async Task EnsureSummaryRunsSealedOrThrowAsync(
        SponsorRoiSummaryResponse summary,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        foreach (SystemLatestRunRoi system in summary.Systems)
        {
            if (string.IsNullOrWhiteSpace(system.RunId))
                continue;

            if (!Guid.TryParse(system.RunId.Trim(), out Guid runGuid))
            {
                throw new ConflictException(
                    $"Sponsor ROI board pack blocked: run id '{system.RunId}' is not a valid GUID.");
            }

            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runGuid,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }
}
