using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Posture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance.Posture;

/// <summary>Checks the latest eligible committed run's sealed manifest within the recent scope window.</summary>
public static class GovernancePostureSealedManifestHashGuard
{
    public static async Task EnsureLatestCommittedRunSealedOrThrowAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IRunDetailQueryService runDetailQueryService,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken,
        Func<Guid, CancellationToken, Task<bool>>? canReadRun = null)
    {
        ArgumentNullException.ThrowIfNull(runDetailQueryService);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        (IReadOnlyList<RunSummary>? items, _, _) =
            await runDetailQueryService.ListRunSummariesKeysetAsync(null, 50, cancellationToken).ConfigureAwait(false);

        if (items is null || items.Count == 0)
            return;

        foreach (RunSummary committed in items.Where(IsCommittedSummary))
        {
            if (!AuthorityRunIdentifier.TryParse(committed.RunId, out Guid runGuid))
            {
                if (canReadRun is not null)
                    continue;

                if (string.IsNullOrWhiteSpace(committed.RunId))
                    return;

                throw new ConflictException(
                    $"Architecture posture blocked: run id '{committed.RunId}' is not a valid GUID.");
            }

            if (canReadRun is not null &&
                (runGuid == Guid.Empty || !await canReadRun(runGuid, cancellationToken).ConfigureAwait(false)))
                continue;

            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runGuid,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
            return;
        }
    }

    private static bool IsCommittedSummary(RunSummary summary) =>
        string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase);
}
