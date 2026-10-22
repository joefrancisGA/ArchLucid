using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Api.Services.Admin;

/// <inheritdoc cref="IAdminDiagnosticsService" />
public sealed class AdminDiagnosticsService(
    IAdminIntegrationOutboxDiagnosticsService integrationOutboxDiagnostics,
    IAdminDataConsistencyDiagnosticsService dataConsistencyDiagnostics,
    IAdminRunArchiveDiagnosticsService runArchiveDiagnostics,
    IHostLeaderLeaseRepository hostLeaderLeases,
    ICacheTelemetrySnapshotProvider cacheTelemetrySnapshotProvider) : IAdminDiagnosticsService
{
    private readonly IAdminDataConsistencyDiagnosticsService _dataConsistencyDiagnostics =
        dataConsistencyDiagnostics ?? throw new ArgumentNullException(nameof(dataConsistencyDiagnostics));

    private readonly IAdminIntegrationOutboxDiagnosticsService _integrationOutboxDiagnostics =
        integrationOutboxDiagnostics ?? throw new ArgumentNullException(nameof(integrationOutboxDiagnostics));

    private readonly IAdminRunArchiveDiagnosticsService _runArchiveDiagnostics =
        runArchiveDiagnostics ?? throw new ArgumentNullException(nameof(runArchiveDiagnostics));

    private readonly IHostLeaderLeaseRepository _hostLeaderLeases =
        hostLeaderLeases ?? throw new ArgumentNullException(nameof(hostLeaderLeases));

    private readonly ICacheTelemetrySnapshotProvider _cacheTelemetrySnapshotProvider =
        cacheTelemetrySnapshotProvider ?? throw new ArgumentNullException(nameof(cacheTelemetrySnapshotProvider));

    public Task<AdminOutboxSnapshot> GetOutboxSnapshotAsync(CancellationToken cancellationToken = default) =>
        _integrationOutboxDiagnostics.GetOutboxSnapshotAsync(cancellationToken);

    public Task<IReadOnlyList<HostLeaderLeaseSnapshot>> GetLeasesAsync(CancellationToken cancellationToken = default) =>
        _hostLeaderLeases.ListAllAsync(cancellationToken);

    public Task<IReadOnlyList<IntegrationEventOutboxDeadLetterRow>> ListIntegrationOutboxDeadLettersAsync(
        int maxRows,
        CancellationToken cancellationToken = default) =>
        _integrationOutboxDiagnostics.ListIntegrationOutboxDeadLettersAsync(maxRows, cancellationToken);

    public Task<bool> RetryIntegrationOutboxDeadLetterAsync(Guid outboxId, CancellationToken cancellationToken = default) =>
        _integrationOutboxDiagnostics.RetryIntegrationOutboxDeadLetterAsync(outboxId, cancellationToken);

    public Task<bool> SuppressIntegrationOutboxDeadLetterAsync(
        Guid outboxId,
        IntegrationOutboxDeadLetterSuppressRequest? request,
        CancellationToken cancellationToken = default) =>
        _integrationOutboxDiagnostics.SuppressIntegrationOutboxDeadLetterAsync(outboxId, request, cancellationToken);

    public Task<IntegrationOutboxDeadLetterBulkRetryResponse> RetryIntegrationOutboxDeadLettersAsync(
        IntegrationOutboxDeadLetterBulkRetryRequest request,
        CancellationToken cancellationToken = default) =>
        _integrationOutboxDiagnostics.RetryIntegrationOutboxDeadLettersAsync(request, cancellationToken);

    public Task<IntegrationEventDeadLetterCurlResponse?> TryBuildIntegrationOutboxDeadLetterCurlAsync(
        Guid outboxId,
        CancellationToken cancellationToken = default) =>
        _integrationOutboxDiagnostics.TryBuildIntegrationOutboxDeadLetterCurlAsync(outboxId, cancellationToken);

    public Task<DataConsistencyOrphanCounts> GetDataConsistencyOrphanCountsAsync(CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.GetDataConsistencyOrphanCountsAsync(cancellationToken);

    public Task<DataConsistencyHeaderRepointCounts> GetDataConsistencyHeaderRepointCountsAsync(
        CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.GetDataConsistencyHeaderRepointCountsAsync(cancellationToken);

    public Task<OrphanComparisonRemediationResult> RemediateOrphanComparisonRecordsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.RemediateOrphanComparisonRecordsAsync(dryRun, maxRows, cancellationToken);

    public Task<OrphanGoldenManifestRemediationResult> RemediateOrphanGoldenManifestsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.RemediateOrphanGoldenManifestsAsync(dryRun, maxRows, cancellationToken);

    public Task<OrphanFindingsSnapshotRemediationResult> RemediateOrphanFindingsSnapshotsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.RemediateOrphanFindingsSnapshotsAsync(dryRun, maxRows, cancellationToken);

    public Task<DataConsistencyStaleInFlightSnapshot> GetDataConsistencyStaleInFlightSnapshotAsync(
        int maxSampleRows = 50,
        CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.GetDataConsistencyStaleInFlightSnapshotAsync(maxSampleRows, cancellationToken);

    public Task<StaleInFlightRemediationResult> RemediateStaleInFlightRunsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.RemediateStaleInFlightRunsAsync(dryRun, maxRows, cancellationToken);

    public Task<DataConsistencyMissingArchitectureRequestSnapshot> GetDataConsistencyMissingArchitectureRequestSnapshotAsync(
        int maxSampleRows = 50,
        CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.GetDataConsistencyMissingArchitectureRequestSnapshotAsync(maxSampleRows, cancellationToken);

    public Task<MissingArchitectureRequestRemediationResult> RemediateMissingArchitectureRequestRunsAsync(
        bool dryRun,
        int maxRows,
        CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.RemediateMissingArchitectureRequestRunsAsync(dryRun, maxRows, cancellationToken);

    public Task<RunArchiveBatchResult> ArchiveRunsCreatedBeforeAsync(
        DateTimeOffset createdBeforeUtc,
        CancellationToken cancellationToken = default) =>
        _runArchiveDiagnostics.ArchiveRunsCreatedBeforeAsync(createdBeforeUtc, cancellationToken);

    public Task<RunArchiveByIdsResult> ArchiveRunsByIdsAsync(
        IReadOnlyList<Guid> runIds,
        CancellationToken cancellationToken = default) =>
        _runArchiveDiagnostics.ArchiveRunsByIdsAsync(runIds, cancellationToken);

    public Task<CrossTenantUsageRollup> GetCrossTenantUsageRollupAsync(CancellationToken cancellationToken = default) =>
        _dataConsistencyDiagnostics.GetCrossTenantUsageRollupAsync(cancellationToken);

    public Task<AdminCacheDiagnosticsResponse> GetCacheDiagnosticsAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        CacheTelemetrySnapshot snapshot = _cacheTelemetrySnapshotProvider.GetSnapshot();

        AdminCacheDiagnosticsResponse response = new()
        {
            HotPathReadCacheHits = snapshot.HotPathReadCacheHits,
            HotPathReadCacheMisses = snapshot.HotPathReadCacheMisses,
            HotPathReadCacheInFlightDeduped = snapshot.HotPathReadCacheInFlightDeduped,
            ExplanationCacheHits = snapshot.ExplanationCacheHits,
            ExplanationCacheMisses = snapshot.ExplanationCacheMisses,
            LlmCompletionCacheHits = snapshot.LlmCompletionCacheHits,
            LlmCompletionCacheMisses = snapshot.LlmCompletionCacheMisses,
            GraphProjectionCacheHits = snapshot.GraphProjectionCacheHits,
            GraphProjectionCacheMisses = snapshot.GraphProjectionCacheMisses,
            GraphProjectionCacheEnabled = snapshot.GraphProjectionCacheEnabled,
        };

        return Task.FromResult(response);
    }
}
