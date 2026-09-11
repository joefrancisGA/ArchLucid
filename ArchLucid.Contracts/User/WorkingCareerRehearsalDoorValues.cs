namespace ArchLucid.Contracts.User;

/// <summary>Stored values for the Working Career vs Rehearsal door (ADR 0086 / CG-011).</summary>
public static class WorkingCareerRehearsalDoorValues
{
    public const string Career = "career";

    public const string Rehearsal = "rehearsal";

    /// <summary>
    /// GET default when no explicit row exists. Matches AS-080 new Working tenants.
    /// Clients must not treat this as an explicit pick when the preference is not stored
    /// (grandfathered Simulator clones stay Rehearsal until the operator picks).
    /// </summary>
    public const string Default = Career;

    public static string? NormalizeOrNull(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        string trimmed = value.Trim();

        if (string.Equals(trimmed, Career, StringComparison.OrdinalIgnoreCase))
        {
            return Career;
        }

        if (string.Equals(trimmed, Rehearsal, StringComparison.OrdinalIgnoreCase))
        {
            return Rehearsal;
        }

        return null;
    }

    public static string ParseOrDefault(string? value)
    {
        return NormalizeOrNull(value) ?? Default;
    }

    public static string Serialize(string door)
    {
        return ParseOrDefault(door);
    }

    public static bool IsExplicitValue(string? value)
    {
        return NormalizeOrNull(value) is not null;
    }
}
