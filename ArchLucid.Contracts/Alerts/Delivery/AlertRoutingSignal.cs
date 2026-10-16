namespace ArchLucid.Contracts.Alerts.Delivery;

using ArchLucid.Contracts.Alerts;
using ArchLucid.Contracts.Serialization;

/// <summary>Normalized dimensions used when evaluating routing subscriptions for an alert.</summary>
public sealed class AlertRoutingSignal
{
    private string severity = string.Empty;

    public string Severity
    {
        get => severity;
        init => severity = ContractCollectionDefaults.CoalesceRequired(value);
    }

    /// <summary>Typically <see cref="AlertRecord.Category" /> (advisory, security, compliance, …).</summary>
    private string findingType = string.Empty;

    public string FindingType
    {
        get => findingType;
        init => findingType = ContractCollectionDefaults.CoalesceRequired(value);
    }

    private IReadOnlyList<string> tags = [];

    public IReadOnlyList<string> Tags
    {
        get => tags;
        init => tags = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    public static AlertRoutingSignal FromAlert(AlertRecord alert)
    {
        ArgumentNullException.ThrowIfNull(alert);

        return new AlertRoutingSignal
        {
            Severity = alert.Severity ?? string.Empty,
            FindingType = alert.Category ?? string.Empty,
            Tags = ExtractTags(alert),
        };
    }

    private static IReadOnlyList<string> ExtractTags(AlertRecord alert)
    {
        List<string> tags = [];

        string trigger = alert.TriggerValue?.Trim() ?? string.Empty;

        if (trigger.StartsWith("tags:", StringComparison.OrdinalIgnoreCase))
        {
            string raw = trigger["tags:".Length..];

            foreach (string part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                if (part.Length > 0)
                {
                    tags.Add(part);
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(alert.Category))
        {
            tags.Add(alert.Category.Trim());
        }

        return tags;
    }
}
