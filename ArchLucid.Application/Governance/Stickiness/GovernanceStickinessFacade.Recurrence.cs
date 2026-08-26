using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance.Stickiness;

public sealed partial class GovernanceStickinessFacade
{
    /// <inheritdoc />
    public async Task<ArchitectureReviewRecurrenceSchedule> CreateRecurrenceScheduleAsync(
        CreateArchitectureReviewRecurrenceScheduleRequest request,
        CancellationToken ct)
    {
        if (request.SourceRunId == Guid.Empty)
            throw new ArgumentException("Source run id is required.");

        if (!request.IsEnabled.HasValue)
        {
            throw new ArgumentException(
                "isEnabled is required. Set true to activate recurring assessments or false to save paused.");
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        DateTime now = TimeProvider.System.UtcNowDateTime();
        string cronExpression = string.IsNullOrWhiteSpace(request.CronExpression)
            ? "0 8 * * 1"
            : request.CronExpression.Trim();

        Persistence.Models.RunRecord? sourceRun = await _runRepository
            .GetByIdAsync(scope, request.SourceRunId, ct)
            .ConfigureAwait(false);

        if (sourceRun is null)
        {
            throw new ArgumentException(
                $"Source run '{request.SourceRunId:D}' was not found in the current scope.",
                nameof(request));
        }

        if (!_recurrenceNextRunCalculator.IsSupportedCronExpression(cronExpression))
            throw new ArgumentException(RecurrenceScheduleCronValidation.InvalidCronMessage);

        DateTime? nextRunUtc =
            _recurrenceNextRunCalculator.ComputeNextRunUtc(cronExpression, now, request.IsEnabled.Value);

        if (request.IsEnabled.Value && nextRunUtc is null)
            throw new ArgumentException(RecurrenceScheduleCronValidation.InvalidCronMessage);

        ArchitectureReviewRecurrenceSchedule schedule = new()
        {
            ScheduleId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            SourceRunId = request.SourceRunId,
            ArchitectureId = sourceRun.ArchitectureId,
            Name = string.IsNullOrWhiteSpace(request.Name) ? "Recurring architecture review" : request.Name.Trim(),
            CronExpression = cronExpression,
            IsEnabled = request.IsEnabled.Value,
            CreatedUtc = now,
            CreatedByUserId = _actorContext.GetActorId(),
            NextRunUtc = nextRunUtc,
        };

        await _recurrenceScheduleRepository.CreateAsync(schedule, ct);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureReviewRecurrenceScheduleCreated,
                DataJson = JsonSerializer.Serialize(new
                {
                    schedule.ScheduleId,
                    schedule.TenantId,
                    schedule.WorkspaceId,
                    schedule.ProjectId,
                    schedule.SourceRunId,
                    schedule.CronExpression,
                    schedule.IsEnabled,
                }),
            },
            ct);

        return schedule;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ArchitectureReviewRecurrenceSchedule>> ListRecurrenceSchedulesAsync(
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _recurrenceScheduleRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct);
    }

    /// <inheritdoc />
    public PreviewRecurrenceScheduleRunsResponse PreviewRecurrenceScheduleRuns(
        PreviewRecurrenceScheduleRunsRequest request)
    {
        if (request.Count is < 1 or > 20)
            throw new ArgumentException("Count must be between 1 and 20.");

        string cronExpression = (request.CronExpression ?? string.Empty).Trim();

        if (!_recurrenceNextRunCalculator.IsSupportedCronExpression(cronExpression))
        {
            return new PreviewRecurrenceScheduleRunsResponse
            {
                IsValid = false,
                ValidationError = RecurrenceScheduleCronValidation.InvalidCronMessage,
                NextRunUtc = Array.Empty<DateTime>(),
            };
        }

        DateTime fromUtc = request.FromUtc ?? TimeProvider.System.UtcNowDateTime();
        IReadOnlyList<DateTime> nextRuns =
            _recurrenceNextRunCalculator.ComputeNextRunsUtc(cronExpression, fromUtc, request.Count);

        if (nextRuns.Count == 0)
        {
            return new PreviewRecurrenceScheduleRunsResponse
            {
                IsValid = false,
                ValidationError = RecurrenceScheduleCronValidation.InvalidCronMessage,
                NextRunUtc = Array.Empty<DateTime>(),
            };
        }

        return new PreviewRecurrenceScheduleRunsResponse
        {
            IsValid = true,
            NextRunUtc = nextRuns,
        };
    }

    /// <inheritdoc />
    public async Task<RecurrenceScheduleUpdateResult> UpdateRecurrenceScheduleAsync(
        Guid scheduleId,
        UpdateArchitectureReviewRecurrenceScheduleRequest request,
        CancellationToken ct)
    {
        ArchitectureReviewRecurrenceSchedule? existing =
            await _recurrenceScheduleRepository.GetByIdAsync(scheduleId, ct);

        if (existing is null)
            return new RecurrenceScheduleUpdateResult(RecurrenceScheduleUpdateOutcome.NotFound, null);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (existing.TenantId != scope.TenantId
            || existing.WorkspaceId != scope.WorkspaceId
            || existing.ProjectId != scope.ProjectId)
        {
            return new RecurrenceScheduleUpdateResult(RecurrenceScheduleUpdateOutcome.NotFound, null);
        }

        if (request.IsEnabled.HasValue)
            existing.IsEnabled = request.IsEnabled.Value;

        if (!string.IsNullOrWhiteSpace(request.Name))
            existing.Name = request.Name.Trim();

        string cron = existing.CronExpression;

        if (!string.IsNullOrWhiteSpace(request.CronExpression))
        {
            cron = request.CronExpression.Trim();

            if (!_recurrenceNextRunCalculator.IsSupportedCronExpression(cron))
                return new RecurrenceScheduleUpdateResult(RecurrenceScheduleUpdateOutcome.InvalidCron, null);

            existing.CronExpression = cron;
        }

        DateTime updateNow = TimeProvider.System.GetUtcNow().UtcDateTime;
        DateTime? nextRunUtc =
            _recurrenceNextRunCalculator.ComputeNextRunUtc(cron, updateNow, existing.IsEnabled);

        if (existing.IsEnabled && nextRunUtc is null)
            return new RecurrenceScheduleUpdateResult(RecurrenceScheduleUpdateOutcome.InvalidCron, null);

        existing.NextRunUtc = nextRunUtc;

        await _recurrenceScheduleRepository.UpdateAsync(existing, ct);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ArchitectureReviewRecurrenceScheduleUpdated,
                DataJson = JsonSerializer.Serialize(new
                {
                    existing.ScheduleId,
                    existing.TenantId,
                    existing.WorkspaceId,
                    existing.ProjectId,
                    existing.CronExpression,
                    existing.IsEnabled,
                }),
            },
            ct);

        return new RecurrenceScheduleUpdateResult(RecurrenceScheduleUpdateOutcome.Updated, existing);
    }

    /// <inheritdoc />
    public async Task<RealizedValueAttestationResponse> GetRealizedValueAttestationAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _attestationService.GetAttestationAsync(scope.TenantId, scope.WorkspaceId, ct);
    }

    /// <inheritdoc />
    public async Task UpsertRealizedValueAttestationAsync(
        UpsertRealizedValueAttestationRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await _attestationService.SaveAttestationAsync(scope.TenantId, scope.WorkspaceId, request, ct);
    }
}
