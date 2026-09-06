using ArchLucid.Application.Governance;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Wave-30 suggestion 365 / wave-36 suggestion 426: infra-evidence ask fail-closed when run- or snapshot-scoped.</summary>
public static class InfraEvidenceAskSealedManifestHashGuard
{
    public static async Task EnsureAskSealedManifestHashOrThrowAsync(
        InfraEvidenceAskRequest request,
        ScopeContext scope,
        IArchitectureDiagramReconciliationRepository reconciliationRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(reconciliationRepository);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        await EnsureRunSealedManifestHashWhenRunScopedOrThrowAsync(
            request.RunId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        if (request.SnapshotId is Guid snapshotId && snapshotId != Guid.Empty)
        {
            await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
                scope,
                snapshotId,
                reconciliationRepository,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }

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
