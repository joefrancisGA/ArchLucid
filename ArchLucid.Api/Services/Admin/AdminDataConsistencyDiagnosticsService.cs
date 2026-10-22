using ArchLucid.Application.Common;
using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Options;

using MissingArchitectureRequestAutoRemediationOptions =
    ArchLucid.Application.DataConsistency.MissingArchitectureRequestAutoRemediationOptions;


namespace ArchLucid.Api.Services.Admin;

public interface IAdminDataConsistencyDiagnosticsService
{
    Task<DataConsistencyOrphanCounts> GetDataConsistencyOrphanCountsAsync(CancellationToken cancellationToken = default);
    Task<DataConsistencyHeaderRepointCounts> GetDataConsistencyHeaderRepointCountsAsync(CancellationToken cancellationToken = default);
    Task<CrossTenantUsageRollup> GetCrossTenantUsageRollupAsync(CancellationToken cancellationToken = default);
    Task<OrphanComparisonRemediationResult> RemediateOrphanComparisonRecordsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
    Task<OrphanGoldenManifestRemediationResult> RemediateOrphanGoldenManifestsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
    Task<OrphanFindingsSnapshotRemediationResult> RemediateOrphanFindingsSnapshotsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
    Task<DataConsistencyStaleInFlightSnapshot> GetDataConsistencyStaleInFlightSnapshotAsync(int maxSampleRows = 50, CancellationToken cancellationToken = default);
    Task<StaleInFlightRemediationResult> RemediateStaleInFlightRunsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
    Task<DataConsistencyMissingArchitectureRequestSnapshot> GetDataConsistencyMissingArchitectureRequestSnapshotAsync(int maxSampleRows = 50, CancellationToken cancellationToken = default);
    Task<MissingArchitectureRequestRemediationResult> RemediateMissingArchitectureRequestRunsAsync(bool dryRun, int maxRows, CancellationToken cancellationToken = default);
}

public sealed partial class AdminDataConsistencyDiagnosticsService(
    IRunRepository runRepository,
    IDbConnectionFactory connectionFactory,
    IOptions<ArchLucidOptions> archLucidOptions,
    IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions> missingArchitectureRequestAutoRemediationOptions,
    IDataConsistencyRemediationExecutor dataConsistencyRemediationExecutor,
    IAdminRunArchiveAuditLogger archiveAuditLogger) : IAdminDataConsistencyDiagnosticsService
{
    private readonly IAdminRunArchiveAuditLogger _archiveAuditLogger =
        archiveAuditLogger ?? throw new ArgumentNullException(nameof(archiveAuditLogger));

    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly IOptionsMonitor<MissingArchitectureRequestAutoRemediationOptions>
        _missingArchitectureRequestAutoRemediationOptions =
            missingArchitectureRequestAutoRemediationOptions
            ?? throw new ArgumentNullException(nameof(missingArchitectureRequestAutoRemediationOptions));

    private readonly IDataConsistencyRemediationExecutor _dataConsistencyRemediationExecutor =
        dataConsistencyRemediationExecutor
        ?? throw new ArgumentNullException(nameof(dataConsistencyRemediationExecutor));

    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));
}
