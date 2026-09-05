using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Security;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;

namespace ArchLucid.Application.Advisory;

public sealed partial class DigestSubscriptionFacade
{
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
        else if (string.Equals(channelType, DigestDeliveryChannelType.Email, StringComparison.OrdinalIgnoreCase))
        {
            if (!IdentityEmailNormalizer.TryNormalize(destination, out string normalizedEmail, out _))
            {
                return new DigestSubscriptionCreateResult
                {
                    Outcome = DigestSubscriptionHttpOutcome.ValidationFailed,
                    Message = $"Destination '{destination}' is not a valid email address.",
                };
            }

            destination = normalizedEmail;
        }

        string canonicalChannelType = CanonicalizeChannelType(channelType);

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        subscription.SubscriptionId = Guid.NewGuid();
        subscription.TenantId = scope.TenantId;
        subscription.WorkspaceId = scope.WorkspaceId;
        subscription.ProjectId = scope.ProjectId;
        subscription.ChannelType = canonicalChannelType;
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
}
