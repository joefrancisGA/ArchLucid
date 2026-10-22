using ArchLucid.Application.Common;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration.Execute.Hooks;

public interface IArchitectureRunExecuteOutboxPublishHook
{
    Task TryPublishRunFailedAsync(
        string runId,
        AgentExecutionFailureSummary failureSummary,
        CancellationToken cancellationToken);

    Task TryPublishQualityGateRejectedAsync(
        string runId,
        AgentOutputQualityGateRejectedException ex,
        CancellationToken cancellationToken);
}

public sealed class ArchitectureRunExecuteOutboxPublishHook(
    IScopeContextProvider scopeContextProvider,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<ArchitectureRunExecuteOutboxPublishHook> logger) : IArchitectureRunExecuteOutboxPublishHook
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IIntegrationEventPublisher _integrationEventPublisher =
        integrationEventPublisher ?? throw new ArgumentNullException(nameof(integrationEventPublisher));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private readonly ILogger<ArchitectureRunExecuteOutboxPublishHook> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task TryPublishRunFailedAsync(
        string runId,
        AgentExecutionFailureSummary failureSummary,
        CancellationToken cancellationToken)
    {
        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await ArchitectureRunIntegrationEventPublishing.TryPublishRunFailedAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions,
            _logger,
            runGuid,
            scope,
            failureSummary,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken).ConfigureAwait(false);
    }

    public async Task TryPublishQualityGateRejectedAsync(
        string runId,
        AgentOutputQualityGateRejectedException ex,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(ex);

        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        await ArchitectureRunIntegrationEventPublishing.TryPublishQualityGateRejectedAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions,
            _logger,
            runGuid,
            scope,
            ex,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken).ConfigureAwait(false);
    }
}
