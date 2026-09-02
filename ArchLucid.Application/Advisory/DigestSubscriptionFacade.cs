using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Advisory;

/// <inheritdoc cref="IDigestSubscriptionFacade" />
public sealed class DigestSubscriptionFacade(
    IScopeContextProvider scopeProvider,
    IDigestSubscriptionRepository subscriptionRepository,
    IDigestDeliveryAttemptRepository attemptRepository,
    IArchitectureDigestRepository digestRepository,
    IAuditService auditService) : IDigestSubscriptionFacade
{
    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IDigestSubscriptionRepository _subscriptionRepository =
        subscriptionRepository ?? throw new ArgumentNullException(nameof(subscriptionRepository));

    private readonly IDigestDeliveryAttemptRepository _attemptRepository =
        attemptRepository ?? throw new ArgumentNullException(nameof(attemptRepository));

    private readonly IArchitectureDigestRepository _digestRepository =
        digestRepository ?? throw new ArgumentNullException(nameof(digestRepository));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    /// <inheritdoc />
    public async Task<DigestSubscriptionCreateResult> CreateAsync(
        DigestSubscription subscription,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(subscription.ChannelType) || string.IsNullOrWhiteSpace(subscription.Destination))
        {
            return new DigestSubscriptionCreateResult
            {
                Outcome = DigestSubscriptionHttpOutcome.ValidationFailed,
                Message = "ChannelType and Destination are required.",
            };
        }

        string channelType = subscription.ChannelType.Trim();
        string destination = subscription.Destination.Trim();

        if (!IsSupportedChannelType(channelType))
        {
            return new DigestSubscriptionCreateResult
            {
                Outcome = DigestSubscriptionHttpOutcome.ValidationFailed,
                Message = $"ChannelType '{channelType}' is not supported.",
            };
        }

        if (IsOutboundWebhookChannel(channelType))
        {
            string? destinationRejection = AlertRoutingWebhookDestinationPolicy.TryGetRejectionReason(destination);

            if (destinationRejection is not null)
            {
                return new DigestSubscriptionCreateResult
                {
                    Outcome = DigestSubscriptionHttpOutcome.ValidationFailed,
                    Message = destinationRejection,
                };
            }
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        subscription.SubscriptionId = Guid.NewGuid();
        subscription.TenantId = scope.TenantId;
        subscription.WorkspaceId = scope.WorkspaceId;
        subscription.ProjectId = scope.ProjectId;
        subscription.ChannelType = channelType;
        subscription.Destination = destination;
        subscription.CreatedUtc = TimeProvider.System.UtcNowDateTime();

        if (string.IsNullOrWhiteSpace(subscription.MetadataJson))
            subscription.MetadataJson = "{}";

        await _subscriptionRepository.CreateAsync(subscription, ct).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.DigestSubscriptionCreated,
                DataJson = JsonSerializer.Serialize(new
                {
                    subscriptionId = subscription.SubscriptionId,
                    subscription.Name,
                    subscription.ChannelType,
                }),
            },
            ct).ConfigureAwait(false);

        return new DigestSubscriptionCreateResult
        {
            Outcome = DigestSubscriptionHttpOutcome.Success,
            Subscription = subscription,
        };
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<DigestSubscription>> ListByScopeAsync(CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        return await _subscriptionRepository.ListByScopeAsync(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<DigestSubscriptionToggleResult> ToggleAsync(Guid subscriptionId, CancellationToken ct)
    {
        DigestSubscription? subscription = await _subscriptionRepository.GetByIdAsync(subscriptionId, ct).ConfigureAwait(false);

        if (subscription is null)
            return new DigestSubscriptionToggleResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (!MatchesScope(subscription, scope))
            return new DigestSubscriptionToggleResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        subscription.IsEnabled = !subscription.IsEnabled;
        await _subscriptionRepository.UpdateAsync(subscription, ct).ConfigureAwait(false);

        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.DigestSubscriptionToggled,
                DataJson = JsonSerializer.Serialize(new { subscriptionId, enabled = subscription.IsEnabled }),
            },
            ct).ConfigureAwait(false);

        return new DigestSubscriptionToggleResult
        {
            Outcome = DigestSubscriptionHttpOutcome.Success,
            Subscription = subscription,
        };
    }

    /// <inheritdoc />
    public async Task<DigestSubscriptionAttemptsResult> ListAttemptsBySubscriptionAsync(
        Guid subscriptionId,
        int take,
        CancellationToken ct)
    {
        DigestSubscription? subscription = await _subscriptionRepository.GetByIdAsync(subscriptionId, ct).ConfigureAwait(false);

        if (subscription is null)
            return new DigestSubscriptionAttemptsResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        if (!MatchesScope(subscription, scope))
            return new DigestSubscriptionAttemptsResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        IReadOnlyList<DigestDeliveryAttempt> attempts = await _attemptRepository.ListBySubscriptionAsync(
            subscriptionId,
            Math.Clamp(take, 1, PaginationDefaults.MaxPageSize),
            ct).ConfigureAwait(false);

        return new DigestSubscriptionAttemptsResult
        {
            Outcome = DigestSubscriptionHttpOutcome.Success,
            Attempts = attempts,
        };
    }

    /// <inheritdoc />
    public async Task<DigestSubscriptionAttemptsResult> ListAttemptsByDigestAsync(Guid digestId, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        ArchitectureDigest? digest = await _digestRepository.GetByIdAsync(digestId, ct).ConfigureAwait(false);

        if (digest is null)
            return new DigestSubscriptionAttemptsResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };

        if (digest.TenantId != scope.TenantId ||
            digest.WorkspaceId != scope.WorkspaceId ||
            digest.ProjectId != scope.ProjectId)
        {
            return new DigestSubscriptionAttemptsResult { Outcome = DigestSubscriptionHttpOutcome.ResourceNotFound };
        }

        IReadOnlyList<DigestDeliveryAttempt> attempts =
            await _attemptRepository.ListByDigestAsync(digestId, ct).ConfigureAwait(false);

        return new DigestSubscriptionAttemptsResult
        {
            Outcome = DigestSubscriptionHttpOutcome.Success,
            Attempts = attempts,
        };
    }

    /// <inheritdoc />
    public async Task<(DigestSubscriptionHttpOutcome Outcome, DigestDeliveryAttemptsBatchDto? Batch, string? Message)>
        ListAttemptsByDigestIdsAsync(IReadOnlyList<Guid> digestIds, CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();

        IReadOnlyList<DigestDeliveryAttempt> attempts = await _attemptRepository.ListByDigestIdsAsync(
            digestIds,
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ct).ConfigureAwait(false);

        Dictionary<Guid, List<DigestDeliveryAttempt>> byDigest = attempts
            .GroupBy(a => a.DigestId)
            .ToDictionary(
                g => g.Key,
                g => g.OrderByDescending(x => x.AttemptedUtc).ToList());

        List<DigestDeliveryAttemptsForDigestDto> items = [];

        foreach (Guid digestId in digestIds.Distinct())
        {
            List<DigestDeliveryAttempt> forDigest =
                byDigest.TryGetValue(digestId, out List<DigestDeliveryAttempt>? list)
                    ? list
                    : [];

            items.Add(new DigestDeliveryAttemptsForDigestDto
            {
                DigestId = digestId,
                Attempts = forDigest,
            });
        }

        return (
            DigestSubscriptionHttpOutcome.Success,
            new DigestDeliveryAttemptsBatchDto { Items = items },
            null);
    }

    private static bool MatchesScope(DigestSubscription subscription, ScopeContext scope) =>
        subscription.TenantId == scope.TenantId &&
        subscription.WorkspaceId == scope.WorkspaceId &&
        subscription.ProjectId == scope.ProjectId;

    private static bool IsSupportedChannelType(string channelType) =>
        string.Equals(channelType, DigestDeliveryChannelType.Email, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(channelType, DigestDeliveryChannelType.TeamsWebhook, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(channelType, DigestDeliveryChannelType.SlackWebhook, StringComparison.OrdinalIgnoreCase);

    private static bool IsOutboundWebhookChannel(string? channelType) =>
        string.Equals(channelType, DigestDeliveryChannelType.TeamsWebhook, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(channelType, DigestDeliveryChannelType.SlackWebhook, StringComparison.OrdinalIgnoreCase);
}
