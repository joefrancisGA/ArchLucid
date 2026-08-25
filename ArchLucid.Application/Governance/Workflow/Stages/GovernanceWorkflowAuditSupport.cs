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
        string promotedBy)
    {
        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        return durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceManifestPromoted,
            promotedBy,
            promotedBy,
            JsonSerializer.Serialize(
                new
                {
                    promotionRecordId = record.PromotionRecordId,
                    runId = record.RunId,
                    manifestVersion = record.ManifestVersion,
                    sourceEnvironment = record.SourceEnvironment,
                    targetEnvironment = record.TargetEnvironment,
                    approvalRequestId = record.ApprovalRequestId
                },
                AuditJsonSerializationOptions.Instance));
    }

    public AuditEvent CreateGovernanceEnvironmentActivatedAuditEvent(
        GovernanceEnvironmentActivation activation,
        string activatedBy)
    {
        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        return durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceEnvironmentActivated,
            activatedBy,
            activatedBy,
            JsonSerializer.Serialize(
                new
                {
                    activationId = activation.ActivationId,
                    runId = activation.RunId,
                    manifestVersion = activation.ManifestVersion,
                    environment = activation.Environment,
                    activatedBy
                },
                AuditJsonSerializationOptions.Instance));
    }

    public AuditEvent CreateGovernanceApprovalSubmittedAuditEvent(
        GovernanceApprovalRequest request,
        string requestedBy)
    {
        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        return durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceApprovalSubmitted,
            requestedBy,
            requestedBy,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId = request.ApprovalRequestId,
                    runId = request.RunId,
                    manifestVersion = request.ManifestVersion,
                    sourceEnvironment = request.SourceEnvironment,
                    targetEnvironment = request.TargetEnvironment
                },
                AuditJsonSerializationOptions.Instance));
    }

    public AuditEvent BuildGovernanceReviewAuditEvent(
        GovernanceApprovalRequest request,
        string eventType,
        string reviewedBy,
        string? reviewComment)
    {
        Guid? auditRunId = Guid.TryParse(request.RunId, out Guid runGuid) ? runGuid : null;
        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        AuditEvent auditEvent = durableScope.CreateAuditEvent(
            eventType,
            reviewedBy,
            reviewedBy,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId = request.ApprovalRequestId,
                    runId = request.RunId,
                    reviewedBy,
                    reviewComment
                },
                AuditJsonSerializationOptions.Instance));
        auditEvent.RunId = auditRunId;

        return auditEvent;
    }

    public async Task LogDryRunValidationAttemptedForApprovalRequestAsync(
        string requestedBy,
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(
            new
            {
                workflow = "approvalRequest",
                manifestVersion,
                sourceEnvironment,
                targetEnvironment
            },
            AuditJsonSerializationOptions.Instance);
        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.GovernanceDryRunValidationAttempted,
            requestedBy,
            requestedBy,
            dataJson);
        auditEvent.RunId = auditRunId;
        await DurableAuditLogRetry.TryLogAsync(
            ct => _auditService.LogAsync(auditEvent, ct),
            _logger,
            $"GovernanceDryRunValidationAttempted:approval:{LogSanitizer.Sanitize(runId)}",
            cancellationToken);
    }

    public async Task LogDryRunValidationAttemptedForPromotionAsync(
        string promotedBy,
        string runId,
        string manifestVersion,
        string sourceEnvironment,
        string targetEnvironment,
        string? approvalRequestId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        Guid? auditRunId = Guid.TryParse(runId, out Guid rid) ? rid : null;
        string dataJson = JsonSerializer.Serialize(
            new
            {
                workflow = "promotion",
                manifestVersion,
                sourceEnvironment,
                targetEnvironment,
                approvalRequestId
            },
            AuditJsonSerializationOptions.Instance);
        AuditEvent auditEvent = scope.CreateAuditEvent(
            AuditEventTypes.GovernanceDryRunValidationAttempted,
            promotedBy,
            promotedBy,
            dataJson);
        auditEvent.RunId = auditRunId;
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
        Guid? auditRunId = Guid.TryParse(request.RunId, out Guid runGuid) ? runGuid : null;
        ScopeContext durableScope = _scopeContextProvider.GetCurrentScope();
        AuditEvent selfApprovalBlocked = durableScope.CreateAuditEvent(
            AuditEventTypes.GovernanceSelfApprovalBlocked,
            reviewedByDisplay,
            reviewedByDisplay,
            JsonSerializer.Serialize(
                new
                {
                    approvalRequestId,
                    requestedBy = request.RequestedBy,
                    requestedByActorKey = request.RequestedByActorKey,
                    attemptedReviewerBy = reviewedByDisplay,
                    attemptedReviewerActorKey = reviewedByActorKey
                },
                AuditJsonSerializationOptions.Instance));
        selfApprovalBlocked.RunId = auditRunId;
        await LogGovernanceDurableWithRetryAsync(
            selfApprovalBlocked,
            $"GovernanceSelfApprovalBlocked:{LogSanitizer.Sanitize(approvalRequestId)}",
            cancellationToken);
    }
}
