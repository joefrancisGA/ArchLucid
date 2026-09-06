using ArchLucid.Application.Analysis;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Coordination;

/// <summary>Wave-33 suggestion 390: cosmos graph-snapshot outbox drain fail-closed on sealed hash.</summary>
public static class CosmosGraphSnapshotOutboxSealedManifestHashGuard
{
    public static Task EnsureRunSealedManifestHashOrThrowAsync(
        Guid runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        RunExportBlobPushSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
}
