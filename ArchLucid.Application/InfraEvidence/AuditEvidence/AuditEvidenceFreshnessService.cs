using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidenceFreshnessService(
    IAuditEvidenceSnapshotRepository snapshotRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditAssessmentRepository assessmentRepository,
    ILogger<AuditEvidenceFreshnessService> logger) : IAuditEvidenceFreshnessService
{
    public async Task<IReadOnlyList<AuditEvidenceFreshnessItemUpdate>> ClassifySnapshotItemsAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<AuditEvidenceSnapshotItemRecord> items =
            await snapshotRepository.ListItemsAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

        if (items.Count == 0)
            return [];

        IReadOnlyDictionary<Guid, AuditEvidenceRequirementRecord> requirementsById =
            await LoadRequirementsForSnapshotAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

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
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        DateTime referenceUtc,
        CancellationToken cancellationToken = default)
    {
        try
        {
            IReadOnlyList<AuditEvidenceFreshnessItemUpdate> updates =
                await ClassifySnapshotItemsAsync(tenantId, auditEvidenceSnapshotId, referenceUtc, cancellationToken);

            if (updates.Count == 0)
                return;

            await snapshotRepository.UpdateItemFreshnessAsync(tenantId, auditEvidenceSnapshotId, updates, cancellationToken);
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
        Guid tenantId,
        Guid assessmentId,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> snapshots =
            await snapshotRepository.ListByAssessmentAsync(tenantId, assessmentId, cancellationToken);

        if (snapshots.Count == 0)
            return new AuditEvidenceFreshnessDashboardRecord();

        AuditEvidenceSnapshotHeaderRecord latestSnapshot = snapshots[0];
        IReadOnlyList<AuditEvidenceSnapshotItemRecord> items =
            await snapshotRepository.ListItemsAsync(tenantId, latestSnapshot.AuditEvidenceSnapshotId, cancellationToken);

        IReadOnlyDictionary<Guid, AuditEvidenceRequirementRecord> requirementsById =
            await LoadRequirementsForSnapshotAsync(tenantId, latestSnapshot.AuditEvidenceSnapshotId, cancellationToken);

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
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default) =>
        snapshotRepository.ListItemsAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

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

    private async Task<IReadOnlyDictionary<Guid, AuditEvidenceRequirementRecord>> LoadRequirementsForSnapshotAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken)
    {
        AuditEvidenceSnapshotHeaderRecord? header =
            await snapshotRepository.TryGetHeaderAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

        if (header is null)
            return new Dictionary<Guid, AuditEvidenceRequirementRecord>();

        AuditAssessmentRecord? assessment =
            await assessmentRepository.TryGetByIdAsync(tenantId, header.AssessmentId, cancellationToken);

        if (assessment is null)
            return new Dictionary<Guid, AuditEvidenceRequirementRecord>();

        IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
            await requirementRepository.ListByFrameworkIdAsync(tenantId, assessment.FrameworkId, cancellationToken);

        return requirements.ToDictionary(requirement => requirement.RequirementId);
    }
}
