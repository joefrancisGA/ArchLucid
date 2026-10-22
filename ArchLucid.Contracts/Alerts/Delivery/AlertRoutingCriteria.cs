using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Alerts.Delivery;

/// <summary>
///     Optional filters for <see cref="AlertRoutingSubscription" /> delivery (stored in <see cref="AlertRoutingSubscription.MetadataJson" />).
///     Empty lists mean "any" for that dimension; <see cref="AlertRoutingSubscription.MinimumSeverity" /> always applies.
/// </summary>
public sealed class AlertRoutingCriteria
{
    private IReadOnlyList<string> severities = [];

    public IReadOnlyList<string> Severities
    {
        get => severities;
        init => severities = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Matched against <see cref="AlertRecord.Category" /> and optional <c>tags:</c> finding-type hints.</summary>
    private IReadOnlyList<string> findingTypes = [];

    public IReadOnlyList<string> FindingTypes
    {
        get => findingTypes;
        init => findingTypes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Matched against alert routing tags (see <see cref="AlertRoutingSignal" />).</summary>
    private IReadOnlyList<string> tags = [];

    public IReadOnlyList<string> Tags
    {
        get => tags;
        init => tags = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
