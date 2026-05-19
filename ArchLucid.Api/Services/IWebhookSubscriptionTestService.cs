namespace ArchLucid.Api.Services;

/// <summary>Delivers a synthetic signed webhook ping for a persisted routing subscription.</summary>
public interface IWebhookSubscriptionTestService
{
    Task<WebhookSubscriptionTestResult> TestAsync(Guid routingSubscriptionId, CancellationToken cancellationToken = default);
}
