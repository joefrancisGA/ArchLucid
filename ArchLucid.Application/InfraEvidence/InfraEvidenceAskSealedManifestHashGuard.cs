using ArchLucid.Application.Governance;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Authorizes an Ask request's evidence selectors before reading a committed seal.</summary>
public static class InfraEvidenceAskSealedManifestHashGuard
{
    public static async Task<bool> TryEnsureAskSealedManifestHashAsync(
        InfraEvidenceAskRequest request,
        ScopeContext scope,
        IAzureInventorySnapshotRepository snapshotRepository,
        IArchitectureDiagramReconciliationRepository reconciliationRepository,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        Func<Guid, CancellationToken, Task<bool>> canReadRunAsync,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(snapshotRepository);
        ArgumentNullException.ThrowIfNull(reconciliationRepository);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);
        ArgumentNullException.ThrowIfNull(canReadRunAsync);

        if (request.RunId is Guid requestedRunId
            && (requestedRunId == Guid.Empty || !await canReadRunAsync(requestedRunId, cancellationToken)))
        {
            return false;
        }

        if (request.SnapshotId is Guid requestedSnapshotId
            && (requestedSnapshotId == Guid.Empty
                || await snapshotRepository.TryGetBySnapshotIdAsync(scope, requestedSnapshotId, cancellationToken) is null))
        {
            return false;
        }

        if (request.RunId is Guid readableRunId)
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                readableRunId, scope, authorityQueryService, manifestHashService, cancellationToken);
        }

        if (request.SnapshotId is Guid snapshotId)
        {
            await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
                scope,
                snapshotId,
                reconciliationRepository,
                authorityQueryService,
                manifestHashService,
                // The explicit run, if also cited by this snapshot, has already been authorized and verified.
                (runId, ct) => runId == request.RunId ? Task.FromResult(false) : canReadRunAsync(runId, ct),
                cancellationToken);
        }

        return true;
    }
}
