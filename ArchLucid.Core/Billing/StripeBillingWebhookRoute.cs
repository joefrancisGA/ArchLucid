namespace ArchLucid.Core.Billing;

/// <summary>Which Stripe webhook endpoint received the event (subscription lifecycle vs wallet top-ups).</summary>
public enum StripeBillingWebhookRoute
{
    Subscription = 0,
    Wallet = 1
}
