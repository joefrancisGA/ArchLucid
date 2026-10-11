using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

namespace ArchLucid.Application.SecureNow;

public sealed class AutomationCollectionRunTrigger(
    ICollectionRunRepository collectionRunRepository,
    IAutomationRunbookStarter automationRunbookStarter,
    IScopeContextProvider scopeContextProvider,
    IAuditService auditService)
    : ICollectionRunTrigger
{
    private static readonly TimeSpan IdempotencyWindow = TimeSpan.FromMinutes(2);

    public async Task<CollectionRunTriggerResult> TriggerAsync(
        string actor,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(actor);
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        CollectionRun? pending = await collectionRunRepository.TryGetRecentPendingAsync(
            scope,
            IdempotencyWindow,
            cancellationToken);

        if (pending is not null)
            return CollectionRunTriggerResult.Duplicate(pending);

        CollectionRun run = new()
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = Guid.NewGuid(),
            AgentVersion = "pending",
            StartedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
            Status = CollectionRunStatus.Running,
            SubscriptionsCoveredJson = "[]",
        };
        await collectionRunRepository.UpsertAsync(run, cancellationToken);

        bool started = await automationRunbookStarter.StartAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            run.RunId,
            actor,
            cancellationToken);

        if (!started)
        {
            await collectionRunRepository.UpsertAsync(
                run with
                {
                    Status = CollectionRunStatus.Failed,
                    FinishedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                    ErrorSummary = "The collection Automation runbook could not be started.",
                },
                cancellationToken);
            return CollectionRunTriggerResult.Failed("The collection Automation runbook could not be started.");
        }

        await auditService.LogAsync(new AuditEvent
        {
            EventType = "SecureNow.CollectionRunTriggered",
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            RunId = run.RunId,
            DataJson = System.Text.Json.JsonSerializer.Serialize(new { runId = run.RunId }),
        }, cancellationToken);
        return CollectionRunTriggerResult.Pending(run);
    }
}
