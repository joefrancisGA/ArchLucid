// stryker disable all
using System.Diagnostics;
using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using Serilog.Context;

namespace ArchLucid.Application.Advisory;

public sealed partial class AdvisoryScanRunner
{
    /// <summary>
    ///     Creates an execution record, runs the scan under ambient scope, and advances the schedule; failures are recorded
    ///     and the schedule still advances.
    /// </summary>
    /// <param name = "schedule">Tenant/workspace/project and cadence metadata.</param>
    /// <param name = "ct">Cancellation token.</param>
    public async Task RunScheduleAsync(AdvisoryScanSchedule schedule, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(schedule);
        using Activity? scanActivity = ArchLucidInstrumentation.AdvisoryScan.StartActivity();
        string logicalCorrelation = FormattableString.Invariant($"advisory-schedule:{schedule.ScheduleId:D}");
        scanActivity?.SetTag("archlucid.schedule_id", schedule.ScheduleId.ToString("D"));
        scanActivity?.SetTag(ActivityCorrelation.LogicalCorrelationIdTag, logicalCorrelation);
        using IDisposable _ = LogContext.PushProperty("CorrelationId", logicalCorrelation);
        ScopeContext scope = new()
        {
            TenantId = schedule.TenantId,
            WorkspaceId = schedule.WorkspaceId,
            ProjectId = schedule.ProjectId
        };
        AdvisoryScanExecution execution = new()
        {
            ExecutionId = Guid.NewGuid(),
            ScheduleId = schedule.ScheduleId,
            TenantId = schedule.TenantId,
            WorkspaceId = schedule.WorkspaceId,
            ProjectId = schedule.ProjectId,
            StartedUtc = TimeProvider.System.UtcNowDateTime(),
            Status = StatusStarted,
            ResultJson = "{}"
        };
        await executionRepository.CreateAsync(execution, ct);
        try
        {
            using (AmbientScopeContext.Push(scope))
                await RunScheduleCoreAsync(schedule, scope, execution, ct);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            execution.Status = StatusFailed;
            execution.CompletedUtc = TimeProvider.System.UtcNowDateTime();
            execution.ErrorMessage = ex.Message;
            await executionRepository.UpdateAsync(execution, ct);
            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.AdvisoryScanExecuted,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            scheduleId = schedule.ScheduleId,
                            executionId = execution.ExecutionId,
                            failed = true,
                            error = ex.Message
                        },
                        AuditJsonSerializationOptions.Instance)
                }, ct);
            await AdvanceScheduleAsync(schedule, ct);
        }
    }

    private async Task FailAsync(AdvisoryScanExecution execution, AdvisoryScanSchedule schedule, string message, CancellationToken ct)
    {
        execution.Status = StatusFailed;
        execution.CompletedUtc = TimeProvider.System.UtcNowDateTime();
        execution.ErrorMessage = message;
        await executionRepository.UpdateAsync(execution, ct);
        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.AdvisoryScanExecuted,
                DataJson = JsonSerializer.Serialize(new
                {
                    scheduleId = schedule.ScheduleId,
                    failed = true,
                    message
                },
                    AuditJsonSerializationOptions.Instance)
            }, ct);
        await AdvanceScheduleAsync(schedule, ct);
    }

    private async Task AdvanceScheduleAsync(AdvisoryScanSchedule schedule, CancellationToken ct)
    {
        DateTime now = TimeProvider.System.UtcNowDateTime();
        schedule.LastRunUtc = now;
        schedule.NextRunUtc = scheduleCalculator.ComputeNextRunUtc(schedule.CronExpression, now);
        await scheduleRepository.UpdateAsync(schedule, ct);
    }

    private Task TryPublishAdvisoryScanCompletedAsync(
        AdvisoryScanSchedule schedule,
        AdvisoryScanExecution execution,
        Guid? runId,
        Guid? comparedToRunId,
        Guid? digestId,
        bool hasRuns,
        string? manifestHash,
        CancellationToken ct)
    {
        object payload = new
        {
            schemaVersion = 1,
            tenantId = schedule.TenantId,
            workspaceId = schedule.WorkspaceId,
            projectId = schedule.ProjectId,
            scheduleId = schedule.ScheduleId,
            executionId = execution.ExecutionId,
            hasRuns,
            runId,
            comparedToRunId,
            digestId,
            manifestHash,
            completedUtc = execution.CompletedUtc ?? TimeProvider.System.UtcNowDateTime()
        };
        string messageId = $"{execution.ExecutionId:D}:{IntegrationEventTypes.AdvisoryScanCompletedV1}";
        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(integrationEventOutbox, integrationEventPublisher,
            integrationEventsOptions.CurrentValue, logger, IntegrationEventTypes.AdvisoryScanCompletedV1, payload, messageId, runId, schedule.TenantId,
            schedule.WorkspaceId, schedule.ProjectId, null, null, ct);
    }

    private static FindingsSnapshot CreateEmptyFindings(ManifestDocument manifest)
    {
        return new FindingsSnapshot
        {
            SchemaVersion = FindingsSchema.CurrentSnapshotVersion,
            FindingsSnapshotId = manifest.FindingsSnapshotId,
            RunId = manifest.RunId,
            ContextSnapshotId = manifest.ContextSnapshotId,
            GraphSnapshotId = manifest.GraphSnapshotId,
            CreatedUtc = manifest.CreatedUtc,
            Findings = [],
            TotalEstimatedSavings = 0m
        };
    }
}
