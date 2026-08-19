namespace ArchLucid.Contracts.Architecture;

/// <summary>Validated primary environment values for Quick Scan requests.</summary>
public static class QuickScanPrimaryEnvironment
{
    public const string Azure = "Azure";
    public const string Aws = "AWS";
    public const string GoogleCloud = "GoogleCloud";
    public const string Multicloud = "Multicloud";
    public const string HybridCloud = "HybridCloud";
    public const string OnPremises = "OnPremises";
    public const string ProviderNeutral = "ProviderNeutral";
    public const string Other = "Other";
    public const string NotSure = "NotSure";

    private static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        Azure,
        Aws,
        GoogleCloud,
        Multicloud,
        HybridCloud,
        OnPremises,
        ProviderNeutral,
        Other,
        NotSure,
    };

    /// <summary>User-facing labels keyed by canonical value.</summary>
    public static readonly IReadOnlyDictionary<string, string> DisplayLabels =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [Azure] = "Azure",
            [Aws] = "AWS",
            [GoogleCloud] = "Google Cloud",
            [Multicloud] = "Multicloud",
            [HybridCloud] = "Hybrid cloud",
            [OnPremises] = "On-premises",
            [ProviderNeutral] = "Provider-neutral",
            [Other] = "Other",
            [NotSure] = "Not sure",
        };

    public static bool TryNormalize(string? raw, out string normalized)
    {
        normalized = string.Empty;

        if (string.IsNullOrWhiteSpace(raw))
            return false;

        string trimmed = raw.Trim();

        foreach (string allowed in Allowed)
        {
            if (!string.Equals(trimmed, allowed, StringComparison.OrdinalIgnoreCase))
                continue;

            normalized = allowed;
            return true;
        }

        return false;
    }

    public static string ToContextLabel(string canonicalValue, string? otherDetail)
    {
        if (string.Equals(canonicalValue, Other, StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(otherDetail))
        {
            return $"Other ({otherDetail.Trim()})";
        }

        if (DisplayLabels.TryGetValue(canonicalValue, out string? label))
            return label;

        return canonicalValue;
    }
}
