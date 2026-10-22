using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventoryDriftClassificationService(
    IAzureInventoryDiffRepository diffRepository,
    IAzureInventoryDriftApprovalRepository driftApprovalRepository,
    IAzureInventoryBaselineRepository baselineRepository,
    IArchitectureDiagramReconciliationRepository reconciliationRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<AzureInventoryDriftClassificationService> logger) : IAzureInventoryDriftClassificationService
{
    private readonly IArchitectureDiagramReconciliationRepository _reconciliationRepository =
        reconciliationRepository ?? throw new ArgumentNullException(nameof(reconciliationRepository));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

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

            await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
                scope,
                summary.SnapshotAId,
                _reconciliationRepository,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);

            await InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync(
                scope,
                summary.SnapshotBId,
                _reconciliationRepository,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);

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
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (ConflictException)
        {
            throw;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Drift report failed for DiffId={DiffId}.", diffId);

            return null;
        }
    }
}
