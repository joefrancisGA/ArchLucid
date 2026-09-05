using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Advisory;

/// <summary>Wave-28 suggestion 291: advisory digest read fail-closed when run-linked digest lacks verified sealed hash.</summary>
public static class AdvisoryDigestReadSealedManifestHashGuard
{
    public static async Task EnsureDigestRunSealedOrThrowAsync(
        ArchitectureDigest digest,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(digest);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!digest.RunId.HasValue || digest.RunId.Value == Guid.Empty)
            return;

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            digest.RunId.Value,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
