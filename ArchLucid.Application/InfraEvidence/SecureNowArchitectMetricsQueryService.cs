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
    IOperationalSecurityFindingRepository findingRepository) : ISecureNowArchitectMetricsQueryService
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

        IReadOnlyList<OperationalSecurityExceptionRecord> exceptions =
            await exceptionRepository.ListByTenantAsync(scope.TenantId, cancellationToken);

        IReadOnlyList<OperationalSecurityExceptionRecord> scopedExceptions = exceptions
            .Where(item => item.WorkspaceId == scope.WorkspaceId && item.ProjectId == scope.ProjectId)
            .ToList();

        IReadOnlyList<OperationalSecurityFindingRecord> findings =
            await findingRepository.ListByTenantAsync(scope.TenantId, status: null, cancellationToken);

        IReadOnlyList<OperationalSecurityFindingRecord> scopedFindings = findings
            .Where(item => item.WorkspaceId == scope.WorkspaceId && item.ProjectId == scope.ProjectId)
            .ToList();

        int openFindings = scopedFindings.Count(item =>
            item.Status is OperationalSecurityFindingStatus.Open or OperationalSecurityFindingStatus.Recurred);

        SecureNowArchitectOutcomeMetricsResult metrics = SecureNowArchitectOutcomeMetricsCalculator.Calculate(
            new SecureNowArchitectOutcomeMetricsInputs
            {
                FromSnapshot = fromSnapshot,
                ToSnapshot = toSnapshot,
                FromPaths = fromPaths,
                ToPaths = toPaths,
                Exceptions = scopedExceptions,
                Findings = scopedFindings,
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
            ExceptionsExpired = metrics.ExceptionsExpired,
            RemediationRecurrenceCount = metrics.RemediationRecurrenceCount,
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
        IReadOnlyList<SecurityEvidencePathRecord> paths = await pathRepository.ListBySnapshotAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            snapshotId,
            cancellationToken);

        Dictionary<Guid, IReadOnlyList<SecurityEvidencePathHopRecord>> hopsByPathId = new();

        foreach (SecurityEvidencePathRecord path in paths)
        {
            IReadOnlyList<SecurityEvidencePathHopRecord> hops =
                await pathRepository.ListHopsByPathAsync(scope.TenantId, path.PathId, cancellationToken);

            hopsByPathId[path.PathId] = hops;
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
