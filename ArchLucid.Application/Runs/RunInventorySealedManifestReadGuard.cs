using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Wave-60 suggestion 708: run inventory list reads fail-closed on latest committed sealed hash in scope.
/// </summary>
public static class RunInventorySealedManifestReadGuard
{
    public static Task EnsureRunInventoryReadAllowedOrThrowAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IRunDetailQueryService runDetailQueryService,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken,
        Func<Guid, CancellationToken, Task<bool>>? canReadRun = null) =>
        GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
            tenantId,
            workspaceId,
            projectId,
            runDetailQueryService,
            authorityQueryService,
            manifestHashService,
            cancellationToken,
            canReadRun);

    /// <summary>Verifies the first visible committed run within the recent inventory window.</summary>
    public static async Task EnsureVisibleRunInventoryReadAllowedOrThrowAsync(
        IAsyncEnumerable<RunRecord> visibleRuns,
        int windowSize,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken ct)
    {
        int inspected = 0;
        await foreach (RunRecord run in visibleRuns.WithCancellation(ct))
        {
            if (string.Equals(run.LegacyRunStatus, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase))
            {
                await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                    run.RunId, scope, authorityQueryService, manifestHashService, ct);
                return;
            }

            if (++inspected == windowSize)
                return;
        }
    }
}
