using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-28 suggestions 283–284: compare run-pair fail-closed on sealed manifest hash.</summary>
public static class CompareRunsSealedManifestHashGuard
{
    public static Task EnsureRunSealedManifestHashOrThrowAsync(
        Guid runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

    public static async Task EnsureRunPairSealedManifestHashesOrThrowAsync(
        Guid leftRunId,
        Guid rightRunId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        await EnsureRunSealedManifestHashOrThrowAsync(
            leftRunId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        await EnsureRunSealedManifestHashOrThrowAsync(
            rightRunId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
