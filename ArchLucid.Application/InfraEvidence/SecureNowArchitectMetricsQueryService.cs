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

        AzureInventorySnapshotRecord? toSnapshot = fromSnapshotId == toSnapshotId
            ? fromSnapshot
            : await snapshotRepository.TryGetBySnapshotIdAsync(scope, toSnapshotId, cancellationToken);

        if (fromSnapshot is null || toSnapshot is null)
        {
            return null;
        }

        if (!BelongsToScope(fromSnapshot, scope) || !BelongsToScope(toSnapshot, scope))
        {
            return null;
        }

        // The calculator defines same-snapshot delta metrics as zero.
        // Do not load path headers or hop metrics when there is no delta to compute.
        bool sameSnapshot = fromSnapshotId == toSnapshotId;
        SecureNowArchitectOutcomeMetricsSnapshotData fromPaths = sameSnapshot
            ? new SecureNowArchitectOutcomeMetricsSnapshotData()
            : await LoadSnapshotPathsAsync(scope, fromSnapshotId, cancellationToken);
        SecureNowArchitectOutcomeMetricsSnapshotData toPaths = sameSnapshot
            ? fromPaths
            : await LoadSnapshotPathsAsync(scope, toSnapshotId, cancellationToken);

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
        ProjectSnapshotScopeKey snapshotScope =
            ProjectSnapshotScopeKey.Create(scope.ToProjectScopeKey(), snapshotId);

        IReadOnlyList<SecurityEvidencePathRecord> paths =
            await pathRepository.ListBySnapshotAsync(snapshotScope, cancellationToken);

        IReadOnlyList<SecurityEvidencePathHopOutcomeMetricReadModel> hopMetrics =
            await pathRepository.ListHopOutcomeMetricsBySnapshotAsync(snapshotScope, cancellationToken);

        Dictionary<Guid, List<SecurityEvidencePathHopRecord>> hopsByPathId = new();

        foreach (SecurityEvidencePathHopOutcomeMetricReadModel metric in hopMetrics)
        {
            if (!hopsByPathId.TryGetValue(metric.PathId, out List<SecurityEvidencePathHopRecord>? hopList))
            {
                hopList = [];
                hopsByPathId[metric.PathId] = hopList;
            }

            hopList.Add(new SecurityEvidencePathHopRecord
            {
                PathId = metric.PathId,
                EdgeType = metric.EdgeType,
                FromNodeId = metric.FromNodeId,
                ToNodeId = metric.ToNodeId,
            });
        }

        Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> readOnlyHopsByPathId =
            hopsByPathId.ToDictionary(
                entry => entry.Key,
                entry => (IReadOnlyList<SecurityEvidencePathHopRecord>)entry.Value);

        return new SecureNowArchitectOutcomeMetricsSnapshotData
        {
            Paths = paths,
            HopsByPathId = readOnlyHopsByPathId,
        };
    }

    private static bool BelongsToScope(AzureInventorySnapshotRecord snapshot, ScopeContext scope) =>
        snapshot.TenantId == scope.TenantId
        && snapshot.WorkspaceId == scope.WorkspaceId
        && snapshot.ProjectId == scope.ProjectId;
}
