namespace ArchLucid.Contracts.Alerts.Delivery;

/// <summary>
///     Optional filters for <see cref="AlertRoutingSubscription" /> delivery (stored in <see cref="AlertRoutingSubscription.MetadataJson" />).
///     Empty lists mean "any" for that dimension; <see cref="AlertRoutingSubscription.MinimumSeverity" /> always applies.
/// </summary>
public sealed class AlertRoutingCriteria
{
    public IReadOnlyList<string> Severities { get; init; } = [];

    /// <summary>Matched against <see cref="AlertRecord.Category" /> and optional <c>tags:</c> finding-type hints.</summary>
    public IReadOnlyList<string> FindingTypes { get; init; } = [];

    /// <summary>Matched against alert routing tags (see <see cref="AlertRoutingSignal" />).</summary>
    public IReadOnlyList<string> Tags { get; init; } = [];
}
