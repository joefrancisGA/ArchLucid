namespace ArchLucid.Contracts.Architecture;

/// <summary>Fallback display name when an architecture identity has no customer title yet (ADR 0074 / DA-02).</summary>
public static class ArchitectureIdentityDisplayNameDefaults
{
    public const string UntitledArchitecture = "Untitled architecture";

    public static string Resolve(string? candidate)
    {
        string trimmed = candidate?.Trim() ?? string.Empty;

        if (trimmed.Length > 0)
            return trimmed;

        return UntitledArchitecture;
    }
}
