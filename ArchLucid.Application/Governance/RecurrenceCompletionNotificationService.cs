using System.Text.Json;

using ArchLucid.Application.Diffs;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance;

/// <inheritdoc cref="IRecurrenceCompletionNotificationService" />
public sealed class RecurrenceCompletionNotificationService(
    IAgentResultRepository agentResultRepository,
    IAgentResultDiffService agentResultDiffService,
    IRecurrenceCompletionRecipientResolver recipientResolver,
    IRecurrenceCompletionEmailDispatcher emailDispatcher,
    IAuditService auditService,
    IOptionsMonitor<RecurrenceCompletionNotificationOptions> optionsMonitor,
    ILogger<RecurrenceCompletionNotificationService> logger) : IRecurrenceCompletionNotificationService
{
    private readonly IAgentResultDiffService _agentResultDiffService =
        agentResultDiffService ?? throw new ArgumentNullException(nameof(agentResultDiffService));

    private readonly IAgentResultRepository _agentResultRepository =
        agentResultRepository ?? throw new ArgumentNullException(nameof(agentResultRepository));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IRecurrenceCompletionEmailDispatcher _emailDispatcher =
        emailDispatcher ?? throw new ArgumentNullException(nameof(emailDispatcher));

    private readonly ILogger<RecurrenceCompletionNotificationService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly IOptionsMonitor<RecurrenceCompletionNotificationOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IRecurrenceCompletionRecipientResolver _recipientResolver =
        recipientResolver ?? throw new ArgumentNullException(nameof(recipientResolver));

    /// <inheritdoc />
    public async Task NotifyCompletionAsync(
        ArchitectureReviewRecurrenceSchedule schedule,
        Guid triggeredRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(schedule);

        if (!_optionsMonitor.CurrentValue.Enabled)
            return;

        ScopeContext scope = new()
        {
            TenantId = schedule.TenantId,
            WorkspaceId = schedule.WorkspaceId,
            ProjectId = schedule.ProjectId,
        };

        string leftRunId = schedule.SourceRunId.ToString("N");
        string rightRunId = triggeredRunId.ToString("N");
        AgentResultDiffResult? diff;

        using (AmbientScopeContext.Push(scope))
        {
            Task<IReadOnlyList<ArchLucid.Contracts.Agents.AgentResult>> leftTask =
                _agentResultRepository.GetRollupProjectionByRunIdAsync(scope, leftRunId, cancellationToken);

            Task<IReadOnlyList<ArchLucid.Contracts.Agents.AgentResult>> rightTask =
                _agentResultRepository.GetRollupProjectionByRunIdAsync(scope, rightRunId, cancellationToken);

            await Task.WhenAll(leftTask, rightTask).ConfigureAwait(false);

            IReadOnlyList<ArchLucid.Contracts.Agents.AgentResult> leftResults =
                await leftTask.ConfigureAwait(false);

            IReadOnlyList<ArchLucid.Contracts.Agents.AgentResult> rightResults =
                await rightTask.ConfigureAwait(false);

            diff = _agentResultDiffService.Compare(leftRunId, leftResults, rightRunId, rightResults);
        }

        (int newFindingCount, int resolvedFindingCount) = RecurrenceFindingDeltaCalculator.CountFindingDelta(diff);
        IReadOnlyList<string> recipients = await _recipientResolver
            .ListRecipientMailboxesAsync(schedule.TenantId, schedule.CreatedByUserId, cancellationToken)
            .ConfigureAwait(false);

        bool emailSent = await _emailDispatcher.TryDispatchAsync(
            schedule.TenantId,
            schedule.ScheduleId,
            triggeredRunId,
            schedule.Name,
            newFindingCount,
            resolvedFindingCount,
            schedule.SourceRunId,
            recipients,
            cancellationToken).ConfigureAwait(false);

        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.ArchitectureReviewRecurrenceNotified,
                    ActorUserId = "system",
                    ActorUserName = "system",
                    TenantId = schedule.TenantId,
                    WorkspaceId = schedule.WorkspaceId,
                    ProjectId = schedule.ProjectId,
                    RunId = triggeredRunId,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            schedule.ScheduleId,
                            schedule.SourceRunId,
                            triggeredRunId,
                            newFindingCount,
                            resolvedFindingCount,
                            emailSent,
                            recipientCount = recipients.Count,
                        },
                        AuditJsonSerializationOptions.Instance),
                },
                ct),
            _logger,
            $"{AuditEventTypes.ArchitectureReviewRecurrenceNotified}:{schedule.ScheduleId:N}:{triggeredRunId:N}",
            cancellationToken).ConfigureAwait(false);
    }
}
