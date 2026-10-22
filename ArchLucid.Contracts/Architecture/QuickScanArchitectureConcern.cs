namespace ArchLucid.Contracts.Architecture;

/// <summary>Optional architecture concern filters for Quick Scan.</summary>
public static class QuickScanArchitectureConcern
{
    public const string Security = "Security";
    public const string Reliability = "Reliability";
    public const string Cost = "Cost";
    public const string Performance = "Performance";
    public const string Compliance = "Compliance";
    public const string Operations = "Operations";

    private static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase)
    {
        Security,
        Reliability,
        Cost,
        Performance,
        Compliance,
        Operations,
    };

    public static readonly IReadOnlyList<string> All =
    [
        Security,
        Reliability,
        Cost,
        Performance,
        Compliance,
        Operations,
    ];

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
}
