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

/// <summary>Wave-27 suggestion 279: architecture posture read fail-closed on latest committed run sealed hash.</summary>
public static class GovernancePostureSealedManifestHashGuard
{
    public static async Task EnsureLatestCommittedRunSealedOrThrowAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        IRunDetailQueryService runDetailQueryService,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
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

        (IReadOnlyList<RunSummary> items, _, _) =
            await runDetailQueryService.ListRunSummariesKeysetAsync(null, 50, cancellationToken).ConfigureAwait(false);

        RunSummary? latestCommitted = items.FirstOrDefault(IsCommittedSummary);

        if (latestCommitted is null || string.IsNullOrWhiteSpace(latestCommitted.RunId))
            return;

        if (!AuthorityRunIdentifier.TryParse(latestCommitted.RunId, out Guid runGuid))
        {
            throw new ConflictException(
                $"Architecture posture blocked: run id '{latestCommitted.RunId}' is not a valid GUID.");
        }

        await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
            runGuid,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);
    }

    private static bool IsCommittedSummary(RunSummary summary) =>
        string.Equals(summary.Status, nameof(ArchitectureRunStatus.Committed), StringComparison.OrdinalIgnoreCase);
}
