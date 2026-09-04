using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Trust;

/// <summary>Wave-26 suggestion 270: run trust evidence card fail-closed on sealed hash.</summary>
public static class RunTrustEvidenceSealedManifestHashGuard
{
    public static async Task EnsureRunSealedManifestHashOrThrowAsync(
        ArchitectureRunDetail detail,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(detail);

        if (!detail.IsCommitted)
            return;

        if (!Guid.TryParse(detail.Run.RunId, out Guid runGuid) || runGuid == Guid.Empty)
        {
            throw new ConflictException(
                $"Trust evidence blocked for run '{detail.Run.RunId}': run id is not a valid GUID.");
        }

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runGuid,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
