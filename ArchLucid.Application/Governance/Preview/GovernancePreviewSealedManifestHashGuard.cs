using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance.Preview;

/// <summary>Wave-26 suggestions 253–254: governance preview activation and environment compare fail-closed on sealed hash.</summary>
public static class GovernancePreviewSealedManifestHashGuard
{
    public static Task EnsureGoldenManifestRunSealedHashOrThrowAsync(
        GoldenManifest manifest,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        ManifestGoldenReadSealedManifestHashGuard.EnsureGoldenManifestRunSealedHashOrThrowAsync(
            manifest,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

    public static async Task EnsureRunSealedManifestHashOrThrowAsync(
        string runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid) || runGuid == Guid.Empty)
        {
            throw new ConflictException(
                $"Governance preview blocked: run id '{runId}' is not a valid GUID.");
        }

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runGuid,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
