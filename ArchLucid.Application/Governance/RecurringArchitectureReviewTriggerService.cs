using System.Text.Json;

using ArchLucid.Application;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance;

public sealed class RecurringArchitectureReviewTriggerService(
    IArchitectureReviewRecurrenceScheduleRepository scheduleRepository,
    IRunRepository runRepository,
    IArchitectureRequestRepository architectureRequestRepository,
    IArchitectureRunCreateOrchestrator createOrchestrator,
    IArchitectureRunExecuteOrchestrator executeOrchestrator,
    IScanScheduleCalculator scheduleCalculator,
    IAuditService auditService,
    ILogger<RecurringArchitectureReviewTriggerService> logger) : IRecurringArchitectureReviewTriggerService
{
    public async Task TriggerScheduleAsync(
        ArchitectureReviewRecurrenceSchedule schedule,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(schedule);
        DateTimeOffset triggeredAt = TimeProvider.System.UtcNowDateTime();
        bool checkpointPersisted = false;

        ScopeContext scope = new()
        {
            TenantId = schedule.TenantId,
            WorkspaceId = schedule.WorkspaceId,
            ProjectId = schedule.ProjectId,
        };

        Guid? newRunId = null;

        try
        {
            using (AmbientScopeContext.Push(scope))
            {
                RunRecord? sourceRun = await runRepository.GetByIdAsync(scope, schedule.SourceRunId, cancellationToken);

                if (sourceRun is null)
                    throw new InvalidOperationException($"Source run {schedule.SourceRunId:N} was not found in scope.");

                if (string.IsNullOrWhiteSpace(sourceRun.ArchitectureRequestId))
                    throw new InvalidOperationException($"Source run {schedule.SourceRunId:N} has no architecture request to clone.");

                ArchitectureRequest? sourceRequest =
                    await architectureRequestRepository.GetByIdAsync(sourceRun.ArchitectureRequestId, cancellationToken);

                if (sourceRequest is null)
                    throw new InvalidOperationException($"Architecture request {sourceRun.ArchitectureRequestId} was not found.");

                ArchitectureRequest clone =
                    RecurringArchitectureReviewRequestCloner.CloneForRecurrence(sourceRequest, schedule.SourceRunId, triggeredAt);

                CreateRunResult created = await createOrchestrator.CreateRunAsync(clone, null, cancellationToken);
                string runIdHex = created.Run.RunId;

                if (!Guid.TryParseExact(runIdHex, "N", out Guid parsedRunId))
                    throw new InvalidOperationException($"Recurrence run id '{runIdHex}' is not a GUID.");

                newRunId = parsedRunId;
            }

            // TB-153: advance schedule before execute so a host crash cannot create a second run for the same window.
            schedule.LastTriggeredUtc = triggeredAt.UtcDateTime;
            schedule.LastTriggeredRunId = newRunId;
            schedule.NextRunUtc = scheduleCalculator.ComputeNextRunUtc(schedule.CronExpression, triggeredAt.UtcDateTime);
            await scheduleRepository.UpdateAsync(schedule, cancellationToken);
            checkpointPersisted = true;

            using (AmbientScopeContext.Push(scope))
            {
                await executeOrchestrator.ExecuteRunAsync(newRunId.Value.ToString("N"), cancellationToken);
            }

            await auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ArchitectureReviewRecurrenceTriggered,
                    ActorUserId = "system",
                    ActorUserName = "system",
                    TenantId = schedule.TenantId,
                    WorkspaceId = schedule.WorkspaceId,
                    ProjectId = schedule.ProjectId,
                    RunId = newRunId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            schedule.ScheduleId,
                            schedule.SourceRunId,
                            triggeredRunId = newRunId,
                            schedule.NextRunUtc,
                        },
                        AuditJsonSerializationOptions.Instance),
                },
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (logger.IsEnabled(LogLevel.Error))
                logger.LogError(ex, "Recurring architecture review failed for schedule {ScheduleId}.", schedule.ScheduleId);

            if (!checkpointPersisted)
            {
                schedule.LastTriggeredUtc = triggeredAt.UtcDateTime;
                schedule.NextRunUtc = scheduleCalculator.ComputeNextRunUtc(schedule.CronExpression, triggeredAt.UtcDateTime);
                await scheduleRepository.UpdateAsync(schedule, cancellationToken);
            }

            throw;
        }
    }
}
