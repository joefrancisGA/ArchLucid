using System.Text.Json;

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tenancy;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application;

/// <summary>Creates, executes (simulator), and commits one authority run for trial welcome UX.</summary>
public sealed class TrialArchitecturePreseedExecutor(
    ITenantRepository tenantRepository,
    IArchitectureRunCreateOrchestrator architectureRunCreateOrchestrator,
    IArchitectureRunExecuteOrchestrator architectureRunExecuteOrchestrator,
    IArchitectureRunCommitOrchestrator architectureRunCommitOrchestrator,
    IAuditService auditService,
    ILogger<TrialArchitecturePreseedExecutor> logger)
{
    private const int MaxPreseedAttempts = 5;

    private readonly IArchitectureRunCommitOrchestrator _architectureRunCommitOrchestrator =
        architectureRunCommitOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunCommitOrchestrator));

    private readonly IArchitectureRunCreateOrchestrator _architectureRunCreateOrchestrator =
        architectureRunCreateOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunCreateOrchestrator));

    private readonly IArchitectureRunExecuteOrchestrator _architectureRunExecuteOrchestrator =
        architectureRunExecuteOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunExecuteOrchestrator));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<TrialArchitecturePreseedExecutor> _logger = logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly ITenantRepository _tenantRepository = tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    public async Task TryProcessTenantAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        TenantWorkspaceLink? link = await _tenantRepository.GetFirstWorkspaceAsync(tenantId, cancellationToken);

        if (link is null)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning("Trial pre-seed skipped: no workspace for tenant {TenantId}.", tenantId);

            return;
        }

        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, cancellationToken);

        if (tenant is null)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning("Trial pre-seed skipped: tenant {TenantId} not found.", tenantId);

            return;
        }

        ScopeContext scope = new() { TenantId = tenantId, WorkspaceId = link.WorkspaceId, ProjectId = link.DefaultProjectId };

        using (AmbientScopeContext.Push(scope))
        {
            try
            {
                ArchitectureRequest request = TrialVerticalWelcomeRequestFactory.Create(tenantId, tenant.IndustryVertical);
                CreateRunResult created = await _architectureRunCreateOrchestrator.CreateRunAsync(request, null, cancellationToken);
                string runId = created.Run.RunId;
                await _architectureRunExecuteOrchestrator.ExecuteRunAsync(runId, cancellationToken);
                CommitRunResult committed = await _architectureRunCommitOrchestrator.CommitRunAsync(runId, cancellationToken);

                if (!Guid.TryParseExact(runId, "N", out Guid welcomeRunId))
                {
                    await RecordPreseedFailureAsync(
                        tenantId,
                        link,
                        $"non_guid_run_id:{runId}",
                        cancellationToken);

                    return;
                }

                await _tenantRepository.MarkTrialArchitecturePreseedCompletedAsync(tenantId, welcomeRunId, cancellationToken);

                if (_logger.IsEnabled(LogLevel.Information))
                {
                    _logger.LogInformation(
                        "Trial architecture pre-seed completed for tenant {TenantId}: run {RunId}, manifest {Version}, vertical {Vertical}.",
                        tenantId,
                        runId,
                        committed.Manifest.Metadata.ManifestVersion,
                        tenant.IndustryVertical ?? "(default)");
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                await RecordPreseedFailureAsync(tenantId, link, ex.Message, cancellationToken);
            }
        }
    }

    [InformationalAudit]
    private async Task RecordPreseedFailureAsync(
        Guid tenantId,
        TenantWorkspaceLink link,
        string lastError,
        CancellationToken cancellationToken)
    {
        int attemptCount =
            await _tenantRepository.IncrementTrialArchitecturePreseedAttemptAsync(tenantId, lastError, cancellationToken);

        if (_logger.IsEnabled(LogLevel.Warning))
        {
            _logger.LogWarning(
                "Trial architecture pre-seed attempt {AttemptCount}/{MaxAttempts} failed for tenant {TenantId}: {Error}.",
                attemptCount,
                MaxPreseedAttempts,
                tenantId,
                lastError);
        }

        if (attemptCount < MaxPreseedAttempts)
            return;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.TrialArchitecturePreseedFailed,
                ActorUserId = "system",
                ActorUserName = "system",
                TenantId = tenantId,
                WorkspaceId = link.WorkspaceId,
                ProjectId = link.DefaultProjectId,
                DataJson = JsonSerializer.Serialize(new { attemptCount, lastError })
            },
            cancellationToken);
    }
}
