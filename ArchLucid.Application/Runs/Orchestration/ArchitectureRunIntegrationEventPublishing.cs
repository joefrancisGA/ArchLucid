using ArchLucid.Contracts.Agents;
using ArchLucid.Core;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.IntegrationOutbox;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Publishes authority run failure integration events after execute orchestration marks a run failed.</summary>
internal static class ArchitectureRunIntegrationEventPublishing
{
    internal static Task TryPublishRunFailedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        Guid runId,
        ScopeContext scope,
        AgentExecutionFailureSummary failureSummary,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(failureSummary);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            runId,
            failureClass = failureSummary.FailureClass,
            agentType = failureSummary.AgentType,
            agentTypeKey = failureSummary.AgentTypeKey,
            reasonCode = failureSummary.ReasonCode,
            triageScenarioId = failureSummary.TriageScenarioId,
        };

        string messageId = $"{runId:D}:{IntegrationEventTypes.AuthorityRunFailedV1}";

        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions.CurrentValue,
            logger,
            IntegrationEventTypes.AuthorityRunFailedV1,
            payload,
            messageId,
            runId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            connection: null,
            transaction: null,
            cancellationToken);
    }

    internal static Task TryPublishQualityGateRejectedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        Guid runId,
        ScopeContext scope,
        AgentOutputQualityGateRejectedException rejection,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(rejection);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            runId,
            traceId = rejection.TraceId,
            agentLabel = rejection.AgentLabel,
            evaluationReason = rejection.EvaluationReason,
            structuralCompletenessRatio = rejection.StructuralCompletenessRatio,
            semanticScore = rejection.SemanticScore,
            rejectReasonCategory = rejection.RejectReasonCategory,
            triageScenarioId = rejection.TriageScenarioId,
            gateDefinitionVersion = rejection.GateDefinitionVersion,
            gateMode = rejection.GateMode,
        };

        string messageId = $"{runId:D}:{IntegrationEventTypes.AuthorityRunQualityGateRejectedV1}";

        return OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            integrationEventOutbox,
            integrationEventPublisher,
            integrationEventsOptions.CurrentValue,
            logger,
            IntegrationEventTypes.AuthorityRunQualityGateRejectedV1,
            payload,
            messageId,
            runId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            connection: null,
            transaction: null,
            cancellationToken);
    }
}
