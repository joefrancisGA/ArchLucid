using System.Text.Json;

using ArchLucid.Contracts.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Admin;
using ArchLucid.Persistence.IntegrationOutbox;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Services.Admin;

public interface IAdminIntegrationOutboxDiagnosticsService
{
    Task<AdminOutboxSnapshot> GetOutboxSnapshotAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<IntegrationEventOutboxDeadLetterRow>> ListIntegrationOutboxDeadLettersAsync(
        int maxRows,
        CancellationToken cancellationToken = default);

    Task<bool> RetryIntegrationOutboxDeadLetterAsync(Guid outboxId, CancellationToken cancellationToken = default);

    Task<bool> SuppressIntegrationOutboxDeadLetterAsync(
        Guid outboxId,
        IntegrationOutboxDeadLetterSuppressRequest? request,
        CancellationToken cancellationToken = default);

    Task<IntegrationOutboxDeadLetterBulkRetryResponse> RetryIntegrationOutboxDeadLettersAsync(
        IntegrationOutboxDeadLetterBulkRetryRequest request,
        CancellationToken cancellationToken = default);

    Task<IntegrationEventDeadLetterCurlResponse?> TryBuildIntegrationOutboxDeadLetterCurlAsync(
        Guid outboxId,
        CancellationToken cancellationToken = default);
}

public sealed class AdminIntegrationOutboxDiagnosticsService(
    IAdminOutboxSnapshotReader adminOutboxSnapshotReader,
    IIntegrationEventOutboxRepository integrationEventOutbox,
    IScopeContextProvider scopeContextProvider,
    IOptions<IntegrationEventsOptions> integrationEventsOptions,
    IAuditService auditService) : IAdminIntegrationOutboxDiagnosticsService
{
    private readonly IAdminOutboxSnapshotReader _adminOutboxSnapshotReader =
        adminOutboxSnapshotReader ?? throw new ArgumentNullException(nameof(adminOutboxSnapshotReader));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IOptions<IntegrationEventsOptions> _integrationEventsOptions =
        integrationEventsOptions ?? throw new ArgumentNullException(nameof(integrationEventsOptions));

    private readonly IIntegrationEventOutboxRepository _integrationEventOutbox =
        integrationEventOutbox ?? throw new ArgumentNullException(nameof(integrationEventOutbox));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<AdminOutboxSnapshot> GetOutboxSnapshotAsync(CancellationToken cancellationToken = default)
    {
        AdminOutboxSnapshotCounts counts = await _adminOutboxSnapshotReader.ReadAsync(cancellationToken);

        return new AdminOutboxSnapshot(
            counts.AuthorityPipelineWorkPending,
            counts.AuthorityPipelineWorkDeadLetter,
            counts.RetrievalIndexingPending,
            counts.IntegrationEventOutboxPublishPending,
            counts.IntegrationEventOutboxDeadLetter);
    }

    public Task<IReadOnlyList<IntegrationEventOutboxDeadLetterRow>> ListIntegrationOutboxDeadLettersAsync(
        int maxRows,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return _integrationEventOutbox.ListDeadLettersAsync(maxRows, scope.TenantId, skip: 0, cancellationToken);
    }

    public async Task<bool> RetryIntegrationOutboxDeadLetterAsync(
        Guid outboxId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        bool ok = await _integrationEventOutbox
            .ResetDeadLetterForRetryAsync(outboxId, scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        if (ok)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.IntegrationOutboxDeadLetterRetried,
                    DataJson = JsonSerializer.Serialize(new { outboxId, single = true })
                },
                cancellationToken).ConfigureAwait(false);
        }

        return ok;
    }

    public async Task<bool> SuppressIntegrationOutboxDeadLetterAsync(
        Guid outboxId,
        IntegrationOutboxDeadLetterSuppressRequest? request,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        bool ok = await _integrationEventOutbox
            .AcknowledgeDeadLetterAsync(outboxId, scope.TenantId, cancellationToken)
            .ConfigureAwait(false);

        if (ok)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.IntegrationOutboxDeadLetterSuppressed,
                    DataJson = JsonSerializer.Serialize(new
                    {
                        outboxId,
                        comment = request?.Comment
                    })
                },
                cancellationToken).ConfigureAwait(false);
        }

        return ok;
    }

    public async Task<IntegrationOutboxDeadLetterBulkRetryResponse> RetryIntegrationOutboxDeadLettersAsync(
        IntegrationOutboxDeadLetterBulkRetryRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IntegrationOutboxDeadLetterBulkRetryResult result =
            await _integrationEventOutbox.RetryMatchingDeadLettersAsync(
                scope.TenantId,
                request.EventType,
                request.MaxRows,
                cancellationToken).ConfigureAwait(false);

        if (result.RetriedCount > 0)
        {
            await _auditService.LogAsync(
                new AuditEvent
                {
                    EventType = AuditEventTypes.IntegrationOutboxDeadLetterRetried,
                    DataJson = JsonSerializer.Serialize(
                        new
                        {
                            tenantId = scope.TenantId,
                            eventType = request.EventType,
                            retriedCount = result.RetriedCount,
                            outboxIds = result.RetriedOutboxIds
                        })
                },
                cancellationToken).ConfigureAwait(false);
        }

        return new IntegrationOutboxDeadLetterBulkRetryResponse
        {
            RetriedCount = result.RetriedCount,
            RetriedOutboxIds = result.RetriedOutboxIds
        };
    }

    public async Task<IntegrationEventDeadLetterCurlResponse?> TryBuildIntegrationOutboxDeadLetterCurlAsync(
        Guid outboxId,
        CancellationToken cancellationToken = default)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        IntegrationEventOutboxEntry? entry =
            await _integrationEventOutbox
                .TryGetDeadLetterEntryAsync(outboxId, scope.TenantId, cancellationToken)
                .ConfigureAwait(false);

        if (entry is null)
            return null;

        string curl = IntegrationEventDeadLetterCurlFormatter.Format(
            entry,
            _integrationEventsOptions.Value.ReplayWebhookReceiverUrl);

        return new IntegrationEventDeadLetterCurlResponse
        {
            OutboxId = outboxId,
            CurlCommand = curl,
        };
    }
}
