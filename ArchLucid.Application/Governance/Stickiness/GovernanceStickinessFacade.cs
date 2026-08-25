using System.Text.Json;

using ArchLucid.Application.Common;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Governance.Stickiness;

/// <summary>
///     Default <see cref="IGovernanceStickinessFacade"/> consolidating stickiness route orchestration previously in
///     <c>GovernanceStickinessController</c>.
/// </summary>
public sealed class GovernanceStickinessFacade(
    IScopeContextProvider scopeContextProvider,
    IActorContext actorContext,
    IFindingDispositionService findingDispositionService,
    IRiskExceptionService riskExceptionService,
    IArchitectureRiskRegisterService riskRegisterService,
    IArchitectureDecisionRegisterService decisionRegisterService,
    IArchitectureReviewRecurrenceScheduleRepository recurrenceScheduleRepository,
    IArchitectureReviewRecurrenceNextRunCalculator recurrenceNextRunCalculator,
    IRunRepository runRepository,
    IFindingMergeConflictResolutionService findingMergeConflictResolutionService,
    IGovernanceDigestDecisionNeededComposer governanceDigestDecisionNeededComposer,
    IReviewsAwaitingActionQueryService reviewsAwaitingActionQueryService,
    IRealizedValueAttestationService attestationService,
    IAuditService auditService) : IGovernanceStickinessFacade
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IActorContext _actorContext =
        actorContext ?? throw new ArgumentNullException(nameof(actorContext));

    private readonly IFindingDispositionService _findingDispositionService =
        findingDispositionService ?? throw new ArgumentNullException(nameof(findingDispositionService));

    private readonly IRiskExceptionService _riskExceptionService =
        riskExceptionService ?? throw new ArgumentNullException(nameof(riskExceptionService));

    private readonly IArchitectureRiskRegisterService _riskRegisterService =
        riskRegisterService ?? throw new ArgumentNullException(nameof(riskRegisterService));

    private readonly IArchitectureDecisionRegisterService _decisionRegisterService =
        decisionRegisterService ?? throw new ArgumentNullException(nameof(decisionRegisterService));

    private readonly IArchitectureReviewRecurrenceScheduleRepository _recurrenceScheduleRepository =
        recurrenceScheduleRepository ?? throw new ArgumentNullException(nameof(recurrenceScheduleRepository));

    private readonly IArchitectureReviewRecurrenceNextRunCalculator _recurrenceNextRunCalculator =
        recurrenceNextRunCalculator ?? throw new ArgumentNullException(nameof(recurrenceNextRunCalculator));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IFindingMergeConflictResolutionService _findingMergeConflictResolutionService =
        findingMergeConflictResolutionService
        ?? throw new ArgumentNullException(nameof(findingMergeConflictResolutionService));

    private readonly IGovernanceDigestDecisionNeededComposer _governanceDigestDecisionNeededComposer =
        governanceDigestDecisionNeededComposer
        ?? throw new ArgumentNullException(nameof(governanceDigestDecisionNeededComposer));

    private readonly IReviewsAwaitingActionQueryService _reviewsAwaitingActionQueryService =
        reviewsAwaitingActionQueryService
        ?? throw new ArgumentNullException(nameof(reviewsAwaitingActionQueryService));

    private readonly IRealizedValueAttestationService _attestationService =
        attestationService ?? throw new ArgumentNullException(nameof(attestationService));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc />
    public async Task<ArchitectureRiskRegisterResponse> GetRiskRegisterAsync(
        Guid? projectId,
        int maxRows,
        bool assignedToMe,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        ArchitectureRiskRegisterListOptions? options = null;

        if (assignedToMe)
        {
            IReadOnlyList<string> identities =
                ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(_actorContext);

            if (identities.Count == 0)
                return new ArchitectureRiskRegisterResponse { Entries = [] };

            options = new ArchitectureRiskRegisterListOptions
            {
                AssignedToUserIds = identities,
                OpenFindingsOnly = true,
            };
        }

        return await _riskRegisterService.GetRegisterAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            Math.Clamp(maxRows, 1, 500),
            options,
            ct);
    }

    /// <inheritdoc />
    public async Task<int> GetAssignedToMeFindingsCountAsync(Guid? projectId, CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        IReadOnlyList<string> identities =
            ArchitectureRiskRegisterAssignedToMeIdentityResolver.Resolve(_actorContext);

        if (identities.Count == 0)
            return 0;

        ArchitectureRiskRegisterListOptions options = new()
        {
            AssignedToUserIds = identities,
            OpenFindingsOnly = true,
        };

        return await _riskRegisterService.CountAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            options,
            ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceReviewsAwaitingActionResponse> GetReviewsAwaitingActionAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _reviewsAwaitingActionQueryService.ListAsync(scope, ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceDecisionsNeededSummaryResponse> GetDecisionsNeededSummaryAsync(
        Guid? projectId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _governanceDigestDecisionNeededComposer.BuildSummaryAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            ct);
    }

    /// <inheritdoc />
    public async Task<GovernanceFindingsRegistersBundleResponse> GetFindingsRegistersBundleAsync(
        Guid? projectId,
        int maxRows,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        int take = Math.Clamp(maxRows, 1, 500);
        Guid resolvedProjectId = projectId ?? scope.ProjectId;

        Task<ArchitectureRiskRegisterResponse> riskTask = _riskRegisterService.GetRegisterAsync(
            scope.TenantId,
            resolvedProjectId,
            take,
            options: null,
            ct);

        Task<ArchitectureDecisionRegisterResponse> decisionTask = _decisionRegisterService.GetRegisterAsync(
            scope.TenantId,
            resolvedProjectId,
            take,
            filters: new ArchitectureDecisionRegisterQueryOptions(),
            ct);

        await Task.WhenAll(riskTask, decisionTask).ConfigureAwait(false);

        return new GovernanceFindingsRegistersBundleResponse
        {
            RiskRegister = await riskTask.ConfigureAwait(false),
            DecisionRegister = await decisionTask.ConfigureAwait(false),
        };
    }

    /// <inheritdoc />
    public async Task<ArchitectureDecisionRegisterResponse> GetDecisionRegisterAsync(
        Guid? projectId,
        int maxRows,
        ArchitectureDecisionRegisterQueryOptions filters,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _decisionRegisterService.GetRegisterAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            Math.Clamp(maxRows, 1, 500),
            filters,
            ct);
    }

    /// <inheritdoc />
    public async Task<FindingDispositionEventDto> RecordDispositionAsync(
        RecordFindingDispositionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _findingDispositionService.RecordAsync(
            request,
            scope,
            _actorContext.GetActorId(),
            ct);
    }

    /// <inheritdoc />
    public async Task<RecordBulkFindingDispositionResponse> RecordBulkDispositionAsync(
        RecordBulkFindingDispositionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string actorId = _actorContext.GetActorId();
        List<string> updated = [];

        foreach (string findingId in request.FindingIds)
        {
            RecordFindingDispositionRequest normalized = new()
            {
                FindingId = findingId,
                RunId = Guid.Empty,
                Disposition = request.Disposition,
                Rationale = request.Rationale,
                RevisitDueUtc = request.Disposition == ArchLucid.Contracts.Findings.FindingDisposition.Deferred && request.RevisitDueUtc is null
                    ? TimeProvider.System.GetUtcNow().AddDays(30)
                    : request.RevisitDueUtc,
            };

            try
            {
                await _findingDispositionService.RecordAsync(normalized, scope, actorId, ct);
                updated.Add(findingId);
            }
            catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
            {
            }
        }

        return new RecordBulkFindingDispositionResponse
        {
            ProcessedCount = updated.Count,
            UpdatedFindingIds = updated,
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<FindingDispositionEventDto>> ListDispositionsAsync(
        string findingId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _findingDispositionService.ListHistoryAsync(scope.TenantId, findingId, ct);
    }

    /// <inheritdoc />
    public async Task<RiskExceptionRecord> CreateRiskExceptionAsync(
        CreateRiskExceptionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _riskExceptionService.CreateAsync(
            request,
            scope,
            _actorContext.GetActorId(),
            ct);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<RiskExceptionRecord>> ListRiskExceptionsAsync(
        Guid? projectId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _riskExceptionService.ListActiveAsync(
            scope.TenantId,
            projectId ?? scope.ProjectId,
            ct);
    }

    /// <inheritdoc />
    public async Task RevokeRiskExceptionAsync(Guid riskExceptionId, CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await _riskExceptionService.RevokeAsync(
            scope.TenantId,
            riskExceptionId,
            _actorContext.GetActorId(),
            ct);
    }

    /// <inheritdoc />
    public async Task<RiskExceptionRecord> RenewRiskExceptionAsync(
        Guid riskExceptionId,
        RenewRiskExceptionRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await _riskExceptionService.RenewAsync(
            scope.TenantId,
            riskExceptionId,
            request,
            _actorContext.GetActorId(),
            ct);
    }

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
            ArchitectureId = sourceRun?.ArchitectureId,
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

        return await _attestationService.GetAttestationAsync(scope.TenantId, ct);
    }

    /// <inheritdoc />
    public async Task UpsertRealizedValueAttestationAsync(
        UpsertRealizedValueAttestationRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await _attestationService.SaveAttestationAsync(scope.TenantId, request, ct);
    }

    /// <inheritdoc />
    public async Task<bool> TryResolveFindingMergeConflictAsync(
        Guid runId,
        string findingId,
        ResolveFindingMergeConflictRequest request,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        bool resolved = await _findingMergeConflictResolutionService.TryResolveAsync(
            scope,
            runId,
            findingId,
            request.Action,
            ct).ConfigureAwait(false);

        if (!resolved)
            return false;

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.FindingMergeConflictResolved,
                RunId = runId,
                DataJson = JsonSerializer.Serialize(new
                {
                    findingId,
                    action = request.Action.ToString(),
                }),
            },
            ct);

        return true;
    }
}
