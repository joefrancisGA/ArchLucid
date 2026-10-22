using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Governance;

/// <summary>Wave-27 suggestion 279: governance insights dashboard fail-closed on sealed hash for referenced runs.</summary>
public static class GovernanceInsightsSealedManifestHashGuard
{
    public static async Task EnsureDashboardRunsSealedOrThrowAsync(
        IReadOnlyList<GovernanceApprovalRequest> pendingApprovals,
        IReadOnlyList<GovernanceApprovalRequest> recentDecisions,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(pendingApprovals);
        ArgumentNullException.ThrowIfNull(recentDecisions);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        HashSet<string> runIds = new(StringComparer.Ordinal);

        foreach (GovernanceApprovalRequest request in pendingApprovals)
        {
            if (!string.IsNullOrWhiteSpace(request.RunId))
                runIds.Add(request.RunId.Trim());
        }

        foreach (GovernanceApprovalRequest request in recentDecisions)
        {
            if (!string.IsNullOrWhiteSpace(request.RunId))
                runIds.Add(request.RunId.Trim());
        }

        await EnsureRunIdsSealedOrThrowAsync(runIds, scope, authorityQueryService, manifestHashService, cancellationToken);
    }

    public static async Task<bool> TryVerifyRunSealedManifestHashAsync(
        string runId,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        if (!Guid.TryParse(runId.Trim(), out Guid runGuid) || runGuid == Guid.Empty)
            return false;

        try
        {
            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runGuid,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);

            return true;
        }
        catch (ConflictException)
        {
            return false;
        }
    }

    private static async Task EnsureRunIdsSealedOrThrowAsync(
        IEnumerable<string> runIds,
        ScopeContext scope,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        foreach (string runId in runIds)
        {
            if (!Guid.TryParse(runId, out Guid runGuid) || runGuid == Guid.Empty)
            {
                throw new ConflictException(
                    $"Governance insights blocked: run id '{runId}' is not a valid GUID.");
            }

            await GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runGuid,
                scope,
                authorityQueryService,
                manifestHashService,
                cancellationToken);
        }
    }
}
