using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventoryDriftClassificationService(
    IAzureInventoryDiffRepository diffRepository,
    IAzureInventoryDriftApprovalRepository driftApprovalRepository,
    IAzureInventoryBaselineRepository baselineRepository,
    ILogger<AzureInventoryDriftClassificationService> logger) : IAzureInventoryDriftClassificationService
{
    public async Task<AzureInventoryDriftReportRecord?> TryGetDriftReportAsync(
        ScopeContext scope,
        Guid diffId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            DateTime asOfUtc = TimeProvider.System.UtcNowDateTime();
            await driftApprovalRepository.MarkExpiredAsync(scope.TenantId, asOfUtc, cancellationToken);

            AzureInventoryDiffSummaryRecord? summary =
                await diffRepository.TryGetByDiffIdAsync(scope, diffId, cancellationToken);

            if (summary is null)
                return null;

            IReadOnlyList<AzureInventoryChangeRecord> changes =
                await diffRepository.ListChangesByDiffIdAsync(scope, diffId, cancellationToken);

            IReadOnlyList<AzureInventoryDriftApprovalRecord> activeApprovals =
                await driftApprovalRepository.ListActiveForDiffAsync(scope, diffId, asOfUtc, cancellationToken);

            List<AzureInventoryClassifiedChangeRecord> classifiedChanges = changes
                .Select(change => new AzureInventoryClassifiedChangeRecord
                {
                    Change = change,
                    Classification = AzureInventoryDriftClassifier.ClassifyChange(change, activeApprovals, asOfUtc),
                })
                .ToList();

            IReadOnlyList<AzureInventoryBaselineRecord> activeBaselines =
                await baselineRepository.ListByScopeAsync(scope, summary.SubscriptionId, cancellationToken);

            return new AzureInventoryDriftReportRecord
            {
                Summary = summary,
                Changes = classifiedChanges,
                ActiveBaselines = activeBaselines,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Drift report failed for DiffId={DiffId}.", diffId);

            return null;
        }
    }
}
