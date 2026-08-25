using System.Data;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.IntegrationOutbox;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Governance.Workflow.Stages;

/// <summary>
///     Shared integration-event publishing helpers for governance workflow stages.
/// </summary>
public sealed class GovernanceWorkflowIntegrationEventSupport(
    IScopeContextProvider scopeContextProvider,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    ILogger<GovernanceWorkflowIntegrationEventSupport> logger)
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IIntegrationEventPublisher _integrationEventPublisher =
        integrationEventPublisher ?? throw new ArgumentNullException(nameof(integrationEventPublisher));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly ILogger<GovernanceWorkflowIntegrationEventSupport> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public Task TryPublishApprovalSubmittedAsync(GovernanceApprovalRequest request, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            approvalRequestId = request.ApprovalRequestId,
            runId = request.RunId,
            manifestVersion = request.ManifestVersion,
            sourceEnvironment = request.SourceEnvironment,
            targetEnvironment = request.TargetEnvironment,
            requestedBy = request.RequestedBy
        };
        string messageId = $"{request.ApprovalRequestId}:{IntegrationEventTypes.GovernanceApprovalSubmittedV1}";
        Guid? runKey = Guid.TryParse(request.RunId, out Guid rid) ? rid : null;
        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions.CurrentValue,
            _logger,
            IntegrationEventTypes.GovernanceApprovalSubmittedV1,
            payload,
            messageId,
            runKey,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            null,
            null,
            cancellationToken);
    }

    public Task TryPublishApprovalApprovedAsync(
        GovernanceApprovalRequest request,
        string reviewedBy,
        DateTime reviewedUtc,
        string? reviewComment,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            approvalRequestId = request.ApprovalRequestId,
            runId = request.RunId,
            manifestVersion = request.ManifestVersion,
            sourceEnvironment = request.SourceEnvironment,
            targetEnvironment = request.TargetEnvironment,
            reviewedBy,
            reviewedUtc,
            reviewComment
        };
        string messageId = $"{request.ApprovalRequestId}:{IntegrationEventTypes.GovernanceApprovalApprovedV1}";
        Guid? runKey = Guid.TryParse(request.RunId, out Guid rid) ? rid : null;
        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions.CurrentValue,
            _logger,
            IntegrationEventTypes.GovernanceApprovalApprovedV1,
            payload,
            messageId,
            runKey,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            null,
            null,
            cancellationToken);
    }

    public Task TryPublishApprovalRejectedAsync(
        GovernanceApprovalRequest request,
        string reviewedBy,
        DateTime reviewedUtc,
        string? reviewComment,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            approvalRequestId = request.ApprovalRequestId,
            runId = request.RunId,
            manifestVersion = request.ManifestVersion,
            sourceEnvironment = request.SourceEnvironment,
            targetEnvironment = request.TargetEnvironment,
            reviewedBy,
            reviewedUtc,
            reviewComment
        };
        string messageId = $"{request.ApprovalRequestId}:{IntegrationEventTypes.GovernanceApprovalRejectedV1}";
        Guid? runKey = Guid.TryParse(request.RunId, out Guid rid) ? rid : null;
        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions.CurrentValue,
            _logger,
            IntegrationEventTypes.GovernanceApprovalRejectedV1,
            payload,
            messageId,
            runKey,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            null,
            null,
            cancellationToken);
    }

    public Task TryPublishPromotionActivatedAsync(
        GovernanceEnvironmentActivation activation,
        string activatedBy,
        IDbConnection? connection,
        IDbTransaction? transaction,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            activationId = activation.ActivationId,
            runId = activation.RunId,
            manifestVersion = activation.ManifestVersion,
            environment = activation.Environment,
            activatedBy,
            activatedUtc = activation.ActivatedUtc
        };
        string messageId = $"{activation.ActivationId}:{IntegrationEventTypes.GovernancePromotionActivatedV1}";
        Guid? runKey = Guid.TryParse(activation.RunId, out Guid rid) ? rid : null;
        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions.CurrentValue,
            _logger,
            IntegrationEventTypes.GovernancePromotionActivatedV1,
            payload,
            messageId,
            runKey,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            connection,
            transaction,
            cancellationToken);
    }
}
