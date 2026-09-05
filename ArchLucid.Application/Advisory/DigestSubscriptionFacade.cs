using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Advisory;

/// <inheritdoc cref="IDigestSubscriptionFacade" />
public sealed partial class DigestSubscriptionFacade(
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

    private static string CanonicalizeChannelType(string channelType)
    {
        if (string.Equals(channelType, DigestDeliveryChannelType.Email, StringComparison.OrdinalIgnoreCase))
            return DigestDeliveryChannelType.Email;

        if (string.Equals(channelType, DigestDeliveryChannelType.TeamsWebhook, StringComparison.OrdinalIgnoreCase))
            return DigestDeliveryChannelType.TeamsWebhook;

        if (string.Equals(channelType, DigestDeliveryChannelType.SlackWebhook, StringComparison.OrdinalIgnoreCase))
            return DigestDeliveryChannelType.SlackWebhook;

        return channelType;
    }
}
