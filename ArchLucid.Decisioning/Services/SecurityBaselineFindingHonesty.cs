namespace ArchLucid.Decisioning.Services;

internal static class SecurityBaselineFindingHonesty
{
    public const string ControlIdNotStored = "Control id was not stored.";

    public const string ControlStatusNotStored = "Control status was not stored.";

    public const string ImpactPresent = "Security control is present.";

    public const string ImpactMissing =
        "Security control is missing and should be enforced.";

    public static string ResolveControlId(string? controlId)
    {
        string trimmed = controlId?.Trim() ?? string.Empty;

        return trimmed.Length > 0 ? trimmed : ControlIdNotStored;
    }

    public static string ResolveStatusPayload(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return ControlStatusNotStored;
        }

        string trimmed = status.Trim();

        if (string.Equals(trimmed, "missing", StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, "present", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed.ToLowerInvariant();
        }

        return ControlStatusNotStored;
    }

    public static string ResolveImpact(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return ControlStatusNotStored;
        }

        if (string.Equals(status, "missing", StringComparison.OrdinalIgnoreCase))
        {
            return ImpactMissing;
        }

        if (string.Equals(status, "present", StringComparison.OrdinalIgnoreCase))
        {
            return ImpactPresent;
        }

        return ControlStatusNotStored;
    }

    public static bool IsMissingStatus(string? status) =>
        string.Equals(status, "missing", StringComparison.OrdinalIgnoreCase);
}
