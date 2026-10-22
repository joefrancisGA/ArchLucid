using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Advisory;

/// <summary>Wave-26 suggestions 276: advisory improvements plan fail-closed on primary and compare-to runs.</summary>
public static class AdvisoryImprovementsPlanSealedManifestHashGuard
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
