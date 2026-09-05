using ArchLucid.Application.Integration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>Publishes authority run failure integration events after execute orchestration marks a run failed.</summary>
internal static class ArchitectureRunIntegrationEventPublishing
{
    internal static async Task TryPublishRunFailedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        Guid runId,
        ScopeContext scope,
        AgentExecutionFailureSummary failureSummary,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(failureSummary);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        string? manifestHash = await RunIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashOrNullAsync(
            runId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            runId,
            manifestHash,
            failureClass = failureSummary.FailureClass,
            agentType = failureSummary.AgentType,
            agentTypeKey = failureSummary.AgentTypeKey,
            reasonCode = failureSummary.ReasonCode,
            triageScenarioId = failureSummary.TriageScenarioId,
        };

        string messageId = $"{runId:D}:{IntegrationEventTypes.AuthorityRunFailedV1}";

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
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

    internal static async Task TryPublishQualityGateRejectedAsync(
        IIntegrationEventOutboxRepository integrationEventOutbox,
        IIntegrationEventPublisher integrationEventPublisher,
        IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
        ILogger logger,
        Guid runId,
        ScopeContext scope,
        AgentOutputQualityGateRejectedException rejection,
        IAuthorityQueryService authorityQueryService,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(integrationEventOutbox);
        ArgumentNullException.ThrowIfNull(integrationEventPublisher);
        ArgumentNullException.ThrowIfNull(integrationEventsOptions);
        ArgumentNullException.ThrowIfNull(logger);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(rejection);
        ArgumentNullException.ThrowIfNull(authorityQueryService);
        ArgumentNullException.ThrowIfNull(manifestHashService);

        string? manifestHash = await RunIntegrationEventManifestHashResolver.TryResolveVerifiedManifestHashOrNullAsync(
            runId,
            scope,
            authorityQueryService,
            manifestHashService,
            cancellationToken);

        object payload = new
        {
            schemaVersion = 1,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            runId,
            manifestHash,
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

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
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
