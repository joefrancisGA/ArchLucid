using ArchiForge.Decisioning.Alerts;

namespace ArchiForge.Decisioning.Alerts.Delivery;

public class AlertDeliveryPayload
{
    public AlertRecord Alert { get; set; } = default!;
    public AlertRoutingSubscription Subscription { get; set; } = default!;
}
