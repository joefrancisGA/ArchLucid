using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Delivery;

namespace ArchLucid.Api.Models.Alerts;

/// <summary>POST body for <c>/v1/alert-routing-subscriptions</c> (backward compatible with prior flat subscription JSON).</summary>
public sealed class AlertRoutingSubscriptionCreatePayload
{
    public string Name { get; set; } = "Alert Routing Subscription";

    public string ChannelType { get; set; } = null!;

    public string Destination { get; set; } = null!;

    public string MinimumSeverity { get; set; } = AlertSeverity.Warning;

    public bool IsEnabled { get; set; } = true;

    public string? MetadataJson { get; set; }

    public AlertRoutingCriteria? RoutingCriteria { get; set; }
}
