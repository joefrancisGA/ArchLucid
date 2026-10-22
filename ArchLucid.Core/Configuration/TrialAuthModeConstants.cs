namespace ArchLucid.Core.Configuration;

/// <summary>String tokens for <see cref="TrialAuthOptions.Modes" />.</summary>
public static class TrialAuthModeConstants
{
    public const string MsaExternalId = "MsaExternalId";
    public const string LocalIdentity = "LocalIdentity";

    public static bool HasMode(IReadOnlyCollection<string>? modes, string mode)
    {
        if (modes is null || modes.Count == 0 || string.IsNullOrWhiteSpace(mode))
            return false;

        // Configuration binding keeps JSON null array elements as null strings
        // (Auth:Trial:Modes:0 = null). Trim on that slot throws in JWT bearer setup
        // and hides a later LocalIdentity or MsaExternalId entry.
        return modes.Any(candidate => ModeEquals(candidate, mode));
    }

    private static bool ModeEquals(string? candidate, string mode)
    {
        if (candidate is null)
            return false;

        return string.Equals(candidate.Trim(), mode, StringComparison.OrdinalIgnoreCase);
    }
}
