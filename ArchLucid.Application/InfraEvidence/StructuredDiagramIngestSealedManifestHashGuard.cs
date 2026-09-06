using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Wave-29 suggestion 314: structured diagram ingest fail-closed on sealed manifest hash.</summary>
public static class StructuredDiagramIngestSealedManifestHashGuard
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
}
