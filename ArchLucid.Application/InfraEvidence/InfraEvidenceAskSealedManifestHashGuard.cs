using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Wave-30 suggestion 365: infra-evidence ask fail-closed when grounded on a run id.</summary>
public static class InfraEvidenceAskSealedManifestHashGuard
{
    public static Task EnsureRunSealedManifestHashWhenRunScopedOrThrowAsync(
        Guid? runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        if (runId is null || runId.Value == Guid.Empty)
            return Task.CompletedTask;

        return GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runId.Value,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }
}
