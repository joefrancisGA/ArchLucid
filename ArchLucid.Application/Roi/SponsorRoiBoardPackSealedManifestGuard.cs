using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Roi;

/// <summary>Wave-25 suggestion 244 / wave-27 suggestion 272: sponsor ROI multi-run rollup fail-closed on sealed hash.</summary>
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

        IEnumerable<string> runIds = summary.Systems
            .Select(system => system.RunId)
            .Where(static runId => !string.IsNullOrWhiteSpace(runId));

        await EnsureRunIdsSealedOrThrowAsync(runIds, scope, authorityQueryService, manifestHashService, cancellationToken);
    }

    public static async Task EnsureRunIdsSealedOrThrowAsync(
        IEnumerable<string> runIds,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(runIds);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        foreach (string runId in runIds)
        {
            if (string.IsNullOrWhiteSpace(runId))
                continue;

            if (!Guid.TryParse(runId.Trim(), out Guid runGuid))
            {
                throw new ConflictException(
                    $"Sponsor ROI rollup blocked: run id '{runId}' is not a valid GUID.");
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
