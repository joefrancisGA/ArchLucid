using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Drafts;

/// <summary>Wave-26 suggestion 256: draft snapshot clone fail-closed on spawned-run sealed hash.</summary>
public static class DraftSnapshotCloneSealedManifestHashGuard
{
    public static Task EnsureSpawnedRunSealedManifestHashOrThrowAsync(
        string? spawnedRunId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(spawnedRunId))
            return Task.CompletedTask;

        if (!Guid.TryParse(spawnedRunId.Trim(), out Guid runGuid) || runGuid == Guid.Empty)
        {
            throw new ConflictException(
                $"Draft snapshot clone blocked: spawned run id '{spawnedRunId}' is not a valid GUID.");
        }

        return GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runGuid,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
