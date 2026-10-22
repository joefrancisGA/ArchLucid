using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidenceFreshnessService(
    IAuditEvidenceSnapshotRepository snapshotRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditAssessmentRepository assessmentRepository,
    ILogger<AuditEvidenceFreshnessService> logger) : IAuditEvidenceFreshnessService
{
    public async Task<IReadOnlyList<AuditEvidenceFreshnessItemUpdate>> ClassifySnapshotItemsInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<AuditEvidenceSnapshotItemRecord> items =
            await snapshotRepository.ListItemsInScopeAsync(scope, auditEvidenceSnapshotId, cancellationToken);
        if (items.Count == 0)
            return [];

        IReadOnlyDictionary<Guid, AuditEvidenceRequirementRecord> requirementsById =
            await LoadRequirementsForSnapshotInScopeAsync(scope, auditEvidenceSnapshotId, cancellationToken);

        return items.Select(item => new AuditEvidenceFreshnessItemUpdate
        {
            EvidenceRowId = item.EvidenceRowId,
            FreshnessStatus = ClassifyItem(item, requirementsById, referenceUtc),
        }).ToList();
    }

    public async Task ApplyFreshnessToSnapshotInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates =
            await ClassifySnapshotItemsInScopeAsync(scope, auditEvidenceSnapshotId, referenceUtc, cancellationToken);
        if (updates.Count == 0)
            return;

        await snapshotRepository.UpdateItemFreshnessInScopeAsync(scope, auditEvidenceSnapshotId, updates, cancellationToken);
    }

    public async Task<AuditEvidenceFreshnessDashboardRecord> GetDashboardCountsInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> snapshots =
            await snapshotRepository.ListByAssessmentInScopeAsync(scope, assessmentId, cancellationToken);
        if (snapshots.Count == 0)
            return new AuditEvidenceFreshnessDashboardRecord();

        AuditEvidenceSnapshotHeaderRecord latestSnapshot = snapshots[0];
        IReadOnlyList<AuditEvidenceSnapshotItemRecord> items =
            await snapshotRepository.ListItemsInScopeAsync(scope, latestSnapshot.AuditEvidenceSnapshotId, cancellationToken);
        IReadOnlyDictionary<Guid, AuditEvidenceRequirementRecord> requirementsById =
            await LoadRequirementsForSnapshotInScopeAsync(scope, latestSnapshot.AuditEvidenceSnapshotId, cancellationToken);

        int currentCount = 0, freshCount = 0, agingCount = 0, staleCount = 0, expiredCount = 0,
            unknownCount = 0, missingCount = 0, recollectCount = 0, manualCount = 0;

        foreach (AuditEvidenceSnapshotItemRecord item in items)
        {
            if (item.CollectionStatus is AuditEvidenceCollectionStatus.Insufficient or AuditEvidenceCollectionStatus.Unsupported)
            {
                missingCount++;
                if (requirementsById.TryGetValue(item.RequirementId, out AuditEvidenceRequirementRecord? requirement)
                    && requirement.ManualEvidenceAllowed)
                    manualCount++;
                continue;
            }

            switch (item.FreshnessStatus)
            {
                case AuditEvidenceFreshnessStatus.Current: currentCount++; break;
                case AuditEvidenceFreshnessStatus.Fresh: freshCount++; break;
                case AuditEvidenceFreshnessStatus.Aging: agingCount++; break;
                case AuditEvidenceFreshnessStatus.Stale: staleCount++; recollectCount++; break;
                case AuditEvidenceFreshnessStatus.Expired: expiredCount++; recollectCount++; break;
                default: unknownCount++; break;
            }
        }

        return new AuditEvidenceFreshnessDashboardRecord
        {
            CurrentCount = currentCount, FreshCount = freshCount, AgingCount = agingCount,
            StaleCount = staleCount, ExpiredCount = expiredCount, UnknownCount = unknownCount,
            MissingCount = missingCount, RecollectCount = recollectCount, ManualCount = manualCount,
        };
    }

    public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListHistoricalItemsInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default) =>
        snapshotRepository.ListItemsInScopeAsync(scope, auditEvidenceSnapshotId, cancellationToken);

    public async Task<IReadOnlyList<AuditEvidenceFreshnessItemUpdate>> ClassifySnapshotItemsAsync(
        ScopeContext scope,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ProjectScopeKey projectScope = scope.ToProjectScopeKey();

        IReadOnlyList<AuditEvidenceSnapshotItemRecord> items =
            await snapshotRepository.ListItemsInScopeAsync(projectScope, auditEvidenceSnapshotId, cancellationToken);

        if (items.Count == 0)
            return [];

        IReadOnlyDictionary<Guid, AuditEvidenceRequirementRecord> requirementsById =
            await LoadRequirementsForSnapshotInScopeAsync(projectScope, auditEvidenceSnapshotId, cancellationToken);

        List<AuditEvidenceFreshnessItemUpdate> updates = [];

        foreach (AuditEvidenceSnapshotItemRecord item in items)
        {
            AuditEvidenceFreshnessStatus freshness = ClassifyItem(item, requirementsById, referenceUtc);
            updates.Add(new AuditEvidenceFreshnessItemUpdate
            {
                EvidenceRowId = item.EvidenceRowId,
                FreshnessStatus = freshness,
            });
        }

        return updates;
    }

    public async Task ApplyFreshnessToSnapshotAsync(
        ScopeContext scope,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates =
                await ClassifySnapshotItemsAsync(scope, auditEvidenceSnapshotId, referenceUtc, cancellationToken);

            if (updates.Count == 0)
                return;

            await snapshotRepository.UpdateItemFreshnessInScopeAsync(
                scope.ToProjectScopeKey(),
                auditEvidenceSnapshotId,
                updates,
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Failed to apply freshness for AuditEvidenceSnapshotId={AuditEvidenceSnapshotId}.",
                auditEvidenceSnapshotId);

            throw;
        }
    }

    public async Task<AuditEvidenceFreshnessDashboardRecord> GetDashboardCountsAsync(
        ScopeContext scope,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ProjectScopeKey projectScope = scope.ToProjectScopeKey();

        IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> snapshots =
            await snapshotRepository.ListByAssessmentInScopeAsync(projectScope, assessmentId, cancellationToken);

        if (snapshots.Count == 0)
            return new AuditEvidenceFreshnessDashboardRecord();

        AuditEvidenceSnapshotHeaderRecord latestSnapshot = snapshots[0];
        IReadOnlyList<AuditEvidenceSnapshotItemRecord> items =
            await snapshotRepository.ListItemsInScopeAsync(
                projectScope,
                latestSnapshot.AuditEvidenceSnapshotId,
                cancellationToken);

        IReadOnlyDictionary<Guid, AuditEvidenceRequirementRecord> requirementsById =
            await LoadRequirementsForSnapshotInScopeAsync(
                projectScope,
                latestSnapshot.AuditEvidenceSnapshotId,
                cancellationToken);

        int currentCount = 0;
        int freshCount = 0;
        int agingCount = 0;
        int staleCount = 0;
        int expiredCount = 0;
        int unknownCount = 0;
        int missingCount = 0;
        int recollectCount = 0;
        int manualCount = 0;

        foreach (AuditEvidenceSnapshotItemRecord item in items)
        {
            if (item.CollectionStatus is AuditEvidenceCollectionStatus.Insufficient
                or AuditEvidenceCollectionStatus.Unsupported)
            {
                missingCount++;

                if (requirementsById.TryGetValue(item.RequirementId, out AuditEvidenceRequirementRecord? requirement)
                    && requirement.ManualEvidenceAllowed)
                {
                    manualCount++;
                }

                continue;
            }

            switch (item.FreshnessStatus)
            {
                case AuditEvidenceFreshnessStatus.Current:
                    currentCount++;
                    break;
                case AuditEvidenceFreshnessStatus.Fresh:
                    freshCount++;
                    break;
                case AuditEvidenceFreshnessStatus.Aging:
                    agingCount++;
                    break;
                case AuditEvidenceFreshnessStatus.Stale:
                    staleCount++;
                    recollectCount++;
                    break;
                case AuditEvidenceFreshnessStatus.Expired:
                    expiredCount++;
                    recollectCount++;
                    break;
                default:
                    unknownCount++;
                    break;
            }
        }

        return new AuditEvidenceFreshnessDashboardRecord
        {
            CurrentCount = currentCount,
            FreshCount = freshCount,
            AgingCount = agingCount,
            StaleCount = staleCount,
            ExpiredCount = expiredCount,
            UnknownCount = unknownCount,
            MissingCount = missingCount,
            RecollectCount = recollectCount,
            ManualCount = manualCount,
        };
    }

    public Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListHistoricalItemsAsync(
        ScopeContext scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default) =>
        ListHistoricalItemsInScopeAsync(scope, auditEvidenceSnapshotId, cancellationToken);

    private async Task<IReadOnlyList<AuditEvidenceSnapshotItemRecord>> ListHistoricalItemsInScopeAsync(
        ScopeContext scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);
        return await snapshotRepository.ListItemsInScopeAsync(
            scope.ToProjectScopeKey(),
            auditEvidenceSnapshotId,
            cancellationToken);
    }

    internal static AuditEvidenceFreshnessStatus ClassifyItem(
        AuditEvidenceSnapshotItemRecord item,
        IReadOnlyDictionary<Guid, AuditEvidenceRequirementRecord> requirementsById,
        DateTime referenceUtc)
    {
        if (item.CollectionStatus is AuditEvidenceCollectionStatus.Insufficient
            or AuditEvidenceCollectionStatus.Unsupported)
        {
            return AuditEvidenceFreshnessStatus.Unknown;
        }

        string? requiredFreshness = null;

        if (requirementsById.TryGetValue(item.RequirementId, out AuditEvidenceRequirementRecord? requirement))
            requiredFreshness = requirement.RequiredFreshness;

        AuditEvidenceFreshnessPolicy policy = AuditEvidenceFreshnessParser.Parse(requiredFreshness);

        return AuditEvidenceFreshnessClassifier.Classify(item.CollectedUtc, referenceUtc, policy);
    }

    private async Task<IReadOnlyDictionary<Guid, AuditEvidenceRequirementRecord>> LoadRequirementsForSnapshotInScopeAsync(
        ProjectScopeKey scope,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken)
    {
        AuditEvidenceSnapshotHeaderRecord? header =
            await snapshotRepository.TryGetHeaderInScopeAsync(scope, auditEvidenceSnapshotId, cancellationToken);

        if (header is null)
            return new Dictionary<Guid, AuditEvidenceRequirementRecord>();

        AuditAssessmentRecord? assessment =
            await assessmentRepository.TryGetByIdInScopeAsync(scope, header.AssessmentId, cancellationToken);

        if (assessment is null)
            return new Dictionary<Guid, AuditEvidenceRequirementRecord>();

        IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
            await requirementRepository.ListByFrameworkIdAsync(scope.TenantId, assessment.FrameworkId, cancellationToken);

        return requirements.ToDictionary(requirement => requirement.RequirementId);
    }
}
