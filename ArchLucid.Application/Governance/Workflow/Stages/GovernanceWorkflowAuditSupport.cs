using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <summary>
///     Shared durable audit and scope-stamping helpers for governance workflow stages.
/// </summary>
public sealed class GovernanceWorkflowAuditSupport(
    IAuditService auditService,
    IScopeContextProvider scopeContextProvider,
    ILogger<GovernanceWorkflowAuditSupport> logger)
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<GovernanceWorkflowAuditSupport> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public void StampGovernanceScope(GovernanceApprovalRequest request)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return;
        request.TenantId = scope.TenantId;
        request.WorkspaceId = scope.WorkspaceId;
        request.ProjectId = scope.ProjectId;
    }

    public void StampGovernanceScope(GovernancePromotionRecord record)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return;
        record.TenantId = scope.TenantId;
        record.WorkspaceId = scope.WorkspaceId;
        record.ProjectId = scope.ProjectId;
    }

    public void StampGovernanceScope(GovernanceEnvironmentActivation activation)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return;
        activation.TenantId = scope.TenantId;
        activation.WorkspaceId = scope.WorkspaceId;
        activation.ProjectId = scope.ProjectId;
    }

    public async Task LogGovernanceDurableWithRetryAsync(
        AuditEvent auditEvent,
        string operationLabel,
        CancellationToken cancellationToken)
    {
        await DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            operationLabel,
            cancellationToken,
            auditEventTypeForMetrics: auditEvent.EventType);
    }

    public async Task LogGovernanceDurableWithRetryInUnitOfWorkAsync(
        AuditEvent auditEvent,
        string operationLabel,
        IArchLucidUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        await DurableAuditLogRetry.LogOrThrowAsync(
            ct => _auditService.LogAsync(auditEvent, unitOfWork, ct),
            _logger,
            operationLabel,
            cancellationToken,
            auditEventTypeForMetrics: auditEvent.EventType);
    }

    public AuditEvent CreateGovernanceManifestPromotedAuditEvent(
        GovernancePromotionRecord record,
        string promotedByDisplay,
        string promotedByActorKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(promotedByDisplay);
        ArgumentException.ThrowIfNullOrWhiteSpace(promotedByActorKey);

        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        AuditEvent auditEvent = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceManifestPromoted,
            promotedByActorKey,
            promotedByDisplay,
            JsonSerializer.Serialize(
                new
                {
                    promotionRecordId = record.PromotionRecordId,
                    runId = record.RunId,
                    manifestVersion = record.ManifestVersion,
                    sourceEnvironment = record.SourceEnvironment,
                    targetEnvironment = record.TargetEnvironment,
                    approvalRequestId = record.ApprovalRequestId,
                    promotedBy = promotedByDisplay,
                    promotedByActorKey
                },
                AuditJsonSerializationOptions.Instance));
        auditEvent.ExplicitActor = true;
        auditEvent.RunId = TryParseGovernanceAuditRunId(record.RunId);

        return auditEvent;
    }

    public AuditEvent CreateGovernanceEnvironmentActivatedAuditEvent(
        GovernanceEnvironmentActivation activation,
        string activatedByDisplay,
        string activatedByActorKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(activatedByDisplay);
        ArgumentException.ThrowIfNullOrWhiteSpace(activatedByActorKey);

        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        AuditEvent auditEvent = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceEnvironmentActivated,
            activatedByActorKey,
            activatedByDisplay,
            JsonSerializer.Serialize(
                new
                {
                    activationId = activation.ActivationId,
                    runId = activation.RunId,
                    manifestVersion = activation.ManifestVersion,
                    environment = activation.Environment,
                    activatedBy = activatedByDisplay,
                    activatedByActorKey
                },
                AuditJsonSerializationOptions.Instance));
        auditEvent.ExplicitActor = true;
        auditEvent.RunId = TryParseGovernanceAuditRunId(activation.RunId);

        return auditEvent;
    }

    public AuditEvent CreateGovernanceApprovalSubmittedAuditEvent(
        GovernanceApprovalRequest request,
        string requestedBy)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(requestedBy);

        string actorKey = string.IsNullOrWhiteSpace(request.RequestedByActorKey)
            ? requestedBy
            : request.RequestedByActorKey;
        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        AuditEvent auditEvent = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceApprovalSubmitted,
            actorKey,
            requestedBy,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId = request.ApprovalRequestId,
                    runId = request.RunId,
                    manifestVersion = request.ManifestVersion,
                    sourceEnvironment = request.SourceEnvironment,
                    targetEnvironment = request.TargetEnvironment,
                    requestedBy,
                    requestedByActorKey = actorKey
                },
                AuditJsonSerializationOptions.Instance));
        auditEvent.ExplicitActor = true;
        auditEvent.RunId = TryParseGovernanceAuditRunId(request.RunId);

        return auditEvent;
    }

    public AuditEvent BuildGovernanceReviewAuditEvent(
        GovernanceApprovalRequest request,
        string eventType,
        string reviewedByDisplay,
        string reviewedByActorKey,
        string? reviewComment)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedByDisplay);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedByActorKey);

        Guid? auditRunId = Guid.TryParse(request.RunId, out Guid runGuid) ? runGuid : null;
        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        AuditEvent auditEvent = durableScope.CreateAuditEvent(
            eventType,
            reviewedByActorKey,
            reviewedByDisplay,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId = request.ApprovalRequestId,
                    runId = request.RunId,
                    manifestVersion = request.ManifestVersion,
                    sourceEnvironment = request.SourceEnvironment,
                    targetEnvironment = request.TargetEnvironment,
                    reviewedBy = reviewedByDisplay,
                    reviewedByActorKey,
                    reviewComment
                },
                AuditJsonSerializationOptions.Instance));
        auditEvent.RunId = auditRunId;
        auditEvent.ExplicitActor = true;

        return auditEvent;
    }

    public async Task LogDryRunValidationAttemptedForApprovalRequestAsync(
        string requestedByDisplay,
        string requestedByActorKey,
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(requestedByDisplay);
        ArgumentException.ThrowIfNullOrWhiteSpace(requestedByActorKey);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(
            new
            {
                workflow = "approvalRequest",
                runId,
                manifestVersion,
                sourceEnvironment,
                targetEnvironment,
                requestedBy = requestedByDisplay,
                requestedByActorKey
            },
            AuditJsonSerializationOptions.Instance);
        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.GovernanceDryRunValidationAttempted,
            requestedByActorKey,
            requestedByDisplay,
            dataJson);
        auditEvent.RunId = auditRunId;
        auditEvent.ExplicitActor = true;
        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            $"GovernanceDryRunValidationAttempted:approval:{LogSanitizer.Sanitize(runId)}",
            cancellationToken);
    }

    public async Task LogDryRunValidationAttemptedForPromotionAsync(
        string promotedByDisplay,
        string promotedByActorKey,
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string? approvalRequestId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(promotedByDisplay);
        ArgumentException.ThrowIfNullOrWhiteSpace(promotedByActorKey);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(
            new
            {
                workflow = "promotion",
                runId,
                manifestVersion,
                sourceEnvironment,
                targetEnvironment,
                approvalRequestId,
                promotedBy = promotedByDisplay,
                promotedByActorKey
            },
            AuditJsonSerializationOptions.Instance);
        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.GovernanceDryRunValidationAttempted,
            promotedByActorKey,
            promotedByDisplay,
            dataJson);
        auditEvent.RunId = auditRunId;
        auditEvent.ExplicitActor = true;
        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            $"GovernanceDryRunValidationAttempted:promotion:{LogSanitizer.Sanitize(runId)}",
            cancellationToken);
    }

    public async Task LogSelfApprovalBlockedAsync(
        GovernanceApprovalRequest request,
        string approvalRequestId,
        string reviewedByDisplay,
        string reviewedByActorKey,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedByDisplay);
        ArgumentException.ThrowIfNullOrWhiteSpace(reviewedByActorKey);

        Guid? auditRunId = Guid.TryParse(request.RunId, out Guid runGuid) ? runGuid : null;
        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        AuditEvent selfApprovalBlocked = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceSelfApprovalBlocked,
            reviewedByActorKey,
            reviewedByDisplay,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId,
                    runId = request.RunId,
                    manifestVersion = request.ManifestVersion,
                    sourceEnvironment = request.SourceEnvironment,
                    targetEnvironment = request.TargetEnvironment,
                    requestedBy = request.RequestedBy,
                    requestedByActorKey = request.RequestedByActorKey,
                    attemptedReviewerBy = reviewedByDisplay,
                    attemptedReviewerActorKey = reviewedByActorKey
                },
                AuditJsonSerializationOptions.Instance));
        selfApprovalBlocked.RunId = auditRunId;
        selfApprovalBlocked.ExplicitActor = true;
        await LogGovernanceDurableWithRetryAsync(
            selfApprovalBlocked,
            $"GovernanceSelfApprovalBlocked:{LogSanitizer.Sanitize(approvalRequestId)}",
            cancellationToken);
    }

    private static Guid? TryParseGovernanceAuditRunId(string? runId)
    {

        if (string.IsNullOrWhiteSpace(runId))
        {
            return null;
        }

        return Guid.TryParse(runId, out Guid runGuid) ? runGuid : null;
    }
}
