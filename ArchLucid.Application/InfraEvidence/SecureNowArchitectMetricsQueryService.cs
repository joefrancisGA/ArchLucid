using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class SecureNowArchitectMetricsQueryService(
    IAzureInventorySnapshotRepository snapshotRepository,
    ISecurityEvidencePathRepository pathRepository,
    IOperationalSecurityExceptionRepository exceptionRepository,
    IProjectScopedOperationalSecurityFindingRepository findingRepository) : ISecureNowArchitectMetricsQueryService
{
    public async Task<SecureNowArchitectOutcomeMetricsResponse?> TryGetOutcomeMetricsAsync(
        ScopeContext scope,
        Guid fromSnapshotId,
        Guid toSnapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (fromSnapshotId == Guid.Empty || toSnapshotId == Guid.Empty)
        {
            return null;
        }

        AzureInventorySnapshotRecord? fromSnapshot =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, fromSnapshotId, cancellationToken);

        AzureInventorySnapshotRecord? toSnapshot =
            await snapshotRepository.TryGetBySnapshotIdAsync(scope, toSnapshotId, cancellationToken);

        if (fromSnapshot is null || toSnapshot is null)
        {
            return null;
        }

        if (!BelongsToScope(fromSnapshot, scope) || !BelongsToScope(toSnapshot, scope))
        {
            return null;
        }

        SecureNowArchitectOutcomeMetricsSnapshotData fromPaths =
            await LoadSnapshotPathsAsync(scope, fromSnapshotId, cancellationToken);
        SecureNowArchitectOutcomeMetricsSnapshotData toPaths =
            await LoadSnapshotPathsAsync(scope, toSnapshotId, cancellationToken);

        ProjectScopeKey projectScope = scope.ToProjectScopeKey();
        DateTime windowStart = SecureNowArchitectOutcomeMetricsCalculator.SnapshotAnchorUtc(fromSnapshot);
        DateTime windowEnd = SecureNowArchitectOutcomeMetricsCalculator.SnapshotAnchorUtc(toSnapshot);

        int openFindings = await findingRepository.CountOpenOrRecurredInScopeAsync(projectScope, cancellationToken);

        int exceptionsExpired = await exceptionRepository.CountExpiredBetweenInScopeAsync(
            projectScope,
            windowStart,
            windowEnd,
            cancellationToken);

        int recurrenceCount = await findingRepository.CountOutcomeRecurrencePairsInScopeAsync(
            projectScope,
            windowStart,
            windowEnd,
            cancellationToken);

        SecureNowArchitectOutcomeMetricsResult metrics = SecureNowArchitectOutcomeMetricsCalculator.Calculate(
            new SecureNowArchitectOutcomeMetricsInputs
            {
                FromSnapshot = fromSnapshot,
                ToSnapshot = toSnapshot,
                FromPaths = fromPaths,
                ToPaths = toPaths,
                OpenFindingsCount = openFindings,
            });

        return new SecureNowArchitectOutcomeMetricsResponse
        {
            FromSnapshotId = fromSnapshotId,
            ToSnapshotId = toSnapshotId,
            RuleVersion = SecureNowArchitectMetricsConstants.RuleVersion,
            CriticalOrHighConfidencePathsRemoved = metrics.CriticalOrHighConfidencePathsRemoved,
            PrivilegedIdentityNodesOnPathsReduced = metrics.PrivilegedIdentityNodesOnPathsReduced,
            UnrestrictedEgressCapabilityPathsReduced = metrics.UnrestrictedEgressCapabilityPathsReduced,
            AssertedCrownJewelExposurePathsRemoved = metrics.AssertedCrownJewelExposurePathsRemoved,
            SharedControlBlastRadiusPathsRemoved = metrics.SharedControlBlastRadiusPathsRemoved,
            ExceptionsExpired = exceptionsExpired,
            RemediationRecurrenceCount = recurrenceCount,
            SupportingOperationalMetrics = new SecureNowArchitectSupportingOperationalMetricsResponse
            {
                OpenFindings = openFindings,
            },
        };
    }

    private async Task<SecureNowArchitectOutcomeMetricsSnapshotData> LoadSnapshotPathsAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<SecurityEvidencePathWithHops> pathsWithHops = await pathRepository.ListWithHopsBySnapshotAsync(
            ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId),
            cancellationToken);

        List<SecurityEvidencePathRecord> paths = [];
        Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> hopsByPathId = new();

        foreach (SecurityEvidencePathWithHops pathWithHops in pathsWithHops)
        {
            paths.Add(pathWithHops.Path);
            hopsByPathId[pathWithHops.Path.PathId] = pathWithHops.Hops;
        }

        return new SecureNowArchitectOutcomeMetricsSnapshotData
        {
            Paths = paths,
            HopsByPathId = hopsByPathId,
        };
    }

    private static bool BelongsToScope(AzureInventorySnapshotRecord snapshot, ScopeContext scope) =>
        snapshot.TenantId == scope.TenantId
        && snapshot.WorkspaceId == scope.WorkspaceId
        && snapshot.ProjectId == scope.ProjectId;
}
