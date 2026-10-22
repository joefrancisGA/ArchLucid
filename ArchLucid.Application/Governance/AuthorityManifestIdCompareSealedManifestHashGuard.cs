using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance;

/// <summary>Wave-28 suggestion 287: authority manifest-id compare fail-closed on sealed hash for both manifests.</summary>
public static class AuthorityManifestIdCompareSealedManifestHashGuard
{
    public static async Task EnsureManifestsSealedOrThrowAsync(
        ManifestDocument left,
        ManifestDocument right,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (left.RunId != Guid.Empty)
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                left.RunId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }

        if (right.RunId != Guid.Empty && right.RunId != left.RunId)
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                right.RunId,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }
}
