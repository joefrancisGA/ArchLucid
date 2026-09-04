using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidenceSnapshotVerificationService(
    IAuditEvidenceSnapshotRepository snapshotRepository,
    ILogger<AuditEvidenceSnapshotVerificationService> logger) : IAuditEvidenceSnapshotVerificationService
{
    public async Task<AuditEvidenceSnapshotVerificationResult> TryVerifyAsync(
        Guid tenantId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            AuditEvidenceSnapshotHeaderRecord? header =
                await snapshotRepository.TryGetHeaderAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

            if (header is null)
            {
                return new AuditEvidenceSnapshotVerificationResult
                {
                    IsValid = false,
                    FailureReason = "Audit evidence snapshot was not found.",
                };
            }

            IReadOnlyList<AuditEvidenceSnapshotItemRecord> items =
                await snapshotRepository.ListItemsAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

            byte[] recomputedRoot = AuditEvidenceSnapshotHasher.ComputeRootHash(items);

            if (!AuditEvidenceSnapshotHasher.HashesEqual(header.EvidenceHashSha256, recomputedRoot))
            {
                return new AuditEvidenceSnapshotVerificationResult
                {
                    IsValid = false,
                    FailureReason = "Root evidence hash does not match stored snapshot hash.",
                };
            }

            foreach (AuditEvidenceSnapshotItemRecord item in items)
            {
                byte[] recomputedItemHash = AuditEvidenceSnapshotHasher.ComputeItemHash(item);

                if (!AuditEvidenceSnapshotHasher.HashesEqual(item.EvidenceHashSha256, recomputedItemHash))
                {
                    return new AuditEvidenceSnapshotVerificationResult
                    {
                        IsValid = false,
                        FailureReason = $"Evidence row {item.EvidenceRowId} hash does not match stored hash.",
                    };
                }
            }

            return new AuditEvidenceSnapshotVerificationResult
            {
                IsValid = true,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Audit evidence snapshot verification failed for SnapshotId={SnapshotId}.",
                auditEvidenceSnapshotId);

            return new AuditEvidenceSnapshotVerificationResult
            {
                IsValid = false,
                FailureReason = ex.Message,
            };
        }
    }
}
