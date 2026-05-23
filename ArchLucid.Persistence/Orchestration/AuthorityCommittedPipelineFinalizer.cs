using System.Text.Json;

using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Serialization;
using ArchLucid.Notifications;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Orchestration;

/// <summary>
///     SQL-backed implementation of <see cref="IAuthorityCommittedPipelineFinalizer" /> (shared by the legacy orchestrator
///     and Durable Task commit activities).
/// </summary>
public sealed class AuthorityCommittedPipelineFinalizer(
    IRunRepository runRepository,
    IRetrievalIndexingOutboxRepository retrievalIndexingOutbox,
    IIntegrationEventPublisher integrationEventPublisher,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IOptionsMonitor<IntegrationEventsOptions> integrationEventsOptions,
    IOptionsMonitor<PublicSiteOptions> publicSiteOptions,
    IGraphSnapshotProjectionCache graphSnapshotProjectionCache,
    IAuthorityRunCommittedChatOpsHook authorityRunCommittedChatOpsHook,
    IAuditService auditService,
    ILogger<AuthorityCommittedPipelineFinalizer> logger) : IAuthorityCommittedPipelineFinalizer
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRetrievalIndexingOutboxRepository _retrievalIndexingOutbox =
        retrievalIndexingOutbox ?? throw new ArgumentNullException(nameof(retrievalIndexingOutbox));

    private readonly IIntegrationEventPublisher _integrationEventPublisher =
        integrationEventPublisher ?? throw new ArgumentNullException(nameof(integrationEventPublisher));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IOptionsMonitor<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly IOptionsMonitor<PublicSiteOptions> _publicSiteOptions =
        publicSiteOptions ?? throw new ArgumentNullException(nameof(publicSiteOptions));

    private readonly IGraphSnapshotProjectionCache _graphSnapshotProjectionCache =
        graphSnapshotProjectionCache ?? throw new ArgumentNullException(nameof(graphSnapshotProjectionCache));

    private readonly IAuthorityRunCommittedChatOpsHook _authorityRunCommittedChatOpsHook =
        authorityRunCommittedChatOpsHook ?? throw new ArgumentNullException(nameof(authorityRunCommittedChatOpsHook));

    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly ILogger<AuthorityCommittedPipelineFinalizer> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<RunRecord> FinalizeAsync(
        RunRecord run,
        ContextSnapshot contextSnapshot,
        FindingsSnapshot findingsSnapshot,
        ManifestDocument manifest,
        DecisionTrace trace,
        ScopeContext scope,
        IArchLucidUnitOfWork uow,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(contextSnapshot);
        ArgumentNullException.ThrowIfNull(findingsSnapshot);
        ArgumentNullException.ThrowIfNull(manifest);
        ArgumentNullException.ThrowIfNull(trace);
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(uow);

        if (uow.SupportsExternalTransaction)

            await _retrievalIndexingOutbox.EnqueueAsync(
                run.RunId,
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                uow.Connection,
                uow.Transaction,
                ct);

        else

            await _retrievalIndexingOutbox.EnqueueAsync(
                run.RunId,
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                ct);


        string integrationMessageId = BuildAuthorityRunCompletedMessageId(run.RunId);
        string publicBaseUrl = NormalizePublicSiteBaseUrl(_publicSiteOptions.CurrentValue.BaseUrl);
        Guid? previousRunId = await TryResolvePreviousCommittedGoldenRunIdAsync(scope, run, ct);
        object[] findingLinks = BuildAuthorityRunCompletedFindingLinks(run.RunId, findingsSnapshot.Findings, publicBaseUrl);
        object integrationPayload = new
        {
            schemaVersion = 1,
            runId = run.RunId,
            manifestId = manifest.ManifestId,
            tenantId = scope.TenantId,
            workspaceId = scope.WorkspaceId,
            projectId = scope.ProjectId,
            previousRunId,
            findings = findingLinks
        };

        await OutboxAwareIntegrationEventPublishing.TryPublishOrEnqueueAsync(
            _integrationEventOutbox,
            _integrationEventPublisher,
            _integrationEventsOptions.CurrentValue,
            _logger,
            IntegrationEventTypes.AuthorityRunCompletedV1,
            integrationPayload,
            integrationMessageId,
            run.RunId,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            uow.SupportsExternalTransaction ? uow.Connection : null,
            uow.SupportsExternalTransaction ? uow.Transaction : null,
            ct);

        await uow.CommitAsync(ct);

        if (run.GraphSnapshotId is { } graphSnapshotId)
            _graphSnapshotProjectionCache.Invalidate(scope, run.RunId, graphSnapshotId);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunCompleted,
                RunId = run.RunId,
                ManifestId = run.GoldenManifestId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        run.GoldenManifestId,
                        run.ArtifactBundleId,
                        run.DecisionTraceId
                    },
                    AuditJsonSerializationOptions.Instance)
            },
            ct);

        if (_logger.IsEnabled(LogLevel.Information))

            _logger.LogInformation(
                "Authority pipeline completed: RunId={RunId}, ManifestId={ManifestId}, ContextSnapshotId={ContextSnapshotId}, FindingsSnapshotId={FindingsSnapshotId}, DecisionTraceId={DecisionTraceId}",
                run.RunId,
                manifest.ManifestId,
                contextSnapshot.SnapshotId,
                findingsSnapshot.FindingsSnapshotId,
                trace.RequireRuleAudit().DecisionTraceId);


        ArchLucidInstrumentation.AuthorityRunsCompletedTotal.Add(1);

        await _authorityRunCommittedChatOpsHook.NotifyAsync(
            new AuthorityRunCommittedChatOpsNotice
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = run.RunId,
                FindingCount = findingsSnapshot.Findings.Count,
                Description = run.Description,
            },
            ct);

        return run;
    }

    private static string BuildAuthorityRunCompletedMessageId(Guid runId)
    {
        return $"{runId:D}:{IntegrationEventTypes.AuthorityRunCompletedV1}";
    }

    private static string NormalizePublicSiteBaseUrl(string? raw)
    {
        const string fallback = "https://archlucid.net";

        if (string.IsNullOrWhiteSpace(raw))
            return fallback;

        string trimmed = raw.Trim().TrimEnd('/');

        return trimmed.Length == 0 ? fallback : trimmed;
    }

    private async Task<Guid?> TryResolvePreviousCommittedGoldenRunIdAsync(ScopeContext scope, RunRecord run, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(run);

        IReadOnlyList<RunRecord> recent = await _runRepository.ListByProjectAsync(scope, run.ProjectId, 100, ct);

        int count = recent.Count;

        for (int i = 0; i < count; i++)
        {
            RunRecord candidate = recent[i];

            if (candidate.RunId == run.RunId)
                continue;
            if (candidate.ArchivedUtc is not null)
                continue;
            if (candidate.GoldenManifestId is null)
                continue;

            return candidate.RunId;
        }

        return null;
    }

    private static object[] BuildAuthorityRunCompletedFindingLinks(Guid runId, List<Finding> findings, string publicBaseUrl)
    {
        if (findings.Count == 0)
            return [];

        List<object> rows = [];

        foreach (Finding f in findings)
        {
            if (string.IsNullOrWhiteSpace(f.FindingId))
                continue;

            string id = f.FindingId.Trim();
            string deepLink = $"{publicBaseUrl}/runs/{runId:D}/findings/{Uri.EscapeDataString(id)}";
            rows.Add(new
            {
                findingId = id,
                deepLinkUrl = deepLink,
                severity = f.Severity.ToString()
            });
        }

        return [.. rows];
    }
}
