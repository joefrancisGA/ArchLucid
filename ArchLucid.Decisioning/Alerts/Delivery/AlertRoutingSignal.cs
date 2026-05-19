namespace ArchLucid.Decisioning.Alerts.Delivery;

/// <summary>Normalized dimensions used when evaluating routing subscriptions for an alert.</summary>
public sealed class AlertRoutingSignal
{
    public string Severity { get; init; } = null!;

    /// <summary>Typically <see cref="AlertRecord.Category" /> (advisory, security, compliance, …).</summary>
    public string FindingType { get; init; } = null!;

    public IReadOnlyList<string> Tags { get; init; } = [];

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
