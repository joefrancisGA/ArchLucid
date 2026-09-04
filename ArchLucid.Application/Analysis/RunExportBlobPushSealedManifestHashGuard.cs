using ArchLucid.Application.Analysis;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-25 suggestion 250: run-export blob push outbox drain fail-closed on sealed hash.</summary>
public static class RunExportBlobPushSealedManifestHashGuard
{
    public static Task EnsureRunSealedManifestHashOrThrowAsync(
        Guid runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId.ToString("D"),
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
}
