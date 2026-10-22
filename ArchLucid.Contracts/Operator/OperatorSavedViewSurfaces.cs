namespace ArchLucid.Contracts.Operator;

/// <summary>Known operator UI surfaces that support per-user saved views.</summary>
public static class OperatorSavedViewSurfaces
{
    /// <summary>Audit log search filters and display preferences.</summary>
    public const string Audit = "audit";

    /// <summary>Graph explorer mode, scope, and filter preferences.</summary>
    public const string Graph = "graph";

    /// <summary>Architecture risk register filters and display preferences.</summary>
    public const string Findings = "findings";

    /// <summary>Infrastructure resource explorer filters and work-queue presets.</summary>
    public const string InfraResources = "infra-resources";

    /// <summary>Returns true when <paramref name="surface" /> is a supported saved-view surface.</summary>
    public static bool IsSupported(string? surface) =>
        string.Equals(surface, Audit, StringComparison.OrdinalIgnoreCase)
        || string.Equals(surface, Graph, StringComparison.OrdinalIgnoreCase)
        || string.Equals(surface, Findings, StringComparison.OrdinalIgnoreCase)
        || string.Equals(surface, InfraResources, StringComparison.OrdinalIgnoreCase);

    /// <summary>Human-readable list of supported surfaces for validation errors.</summary>
    public static string SupportedSurfacesDescription =>
        $"'{Audit}', '{Graph}', '{Findings}', or '{InfraResources}'";

    /// <summary>Normalizes a supported surface to lowercase canonical form; otherwise returns null.</summary>
    public static string? NormalizeOrNull(string? surface)
    {
        if (string.IsNullOrWhiteSpace(surface))
        {
            return null;
        }

        if (string.Equals(surface, Audit, StringComparison.OrdinalIgnoreCase))
        {
            return Audit;
        }

        if (string.Equals(surface, Graph, StringComparison.OrdinalIgnoreCase))
        {
            return Graph;
        }

        if (string.Equals(surface, Findings, StringComparison.OrdinalIgnoreCase))
        {
            return Findings;
        }

        if (string.Equals(surface, InfraResources, StringComparison.OrdinalIgnoreCase))
        {
            return InfraResources;
        }

        return null;
    }
}
