using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>Wave-33 suggestion 379: architecture analysis report build fail-closed on sealed hash.</summary>
public static class ArchitectureAnalysisSealedManifestHashGuard
{
    public static Task EnsureRunSealedManifestHashOrThrowAsync(
        string runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken) =>
        RunExportSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
}
