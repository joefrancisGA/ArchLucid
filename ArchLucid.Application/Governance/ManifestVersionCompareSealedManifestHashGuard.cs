using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance;

/// <summary>Wave-26 suggestion 275: manifest version compare fail-closed on sealed hash for both sides.</summary>
public static class ManifestVersionCompareSealedManifestHashGuard
{
    public static async Task EnsurePairSealedOrThrowAsync(
        GoldenManifest left,
        GoldenManifest right,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(left);
        ArgumentNullException.ThrowIfNull(right);

        await ManifestGoldenReadSealedManifestHashGuard.EnsureGoldenManifestRunSealedHashOrThrowAsync(
            left,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        await ManifestGoldenReadSealedManifestHashGuard.EnsureGoldenManifestRunSealedHashOrThrowAsync(
            right,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
