namespace ArchiForge.Decisioning.Governance.Resolution;

/// <summary>Assignment scope tier for hierarchical governance (tenant baseline → workspace → project).</summary>
public static class GovernanceScopeLevel
{
    public const string Tenant = "Tenant";
    public const string Workspace = "Workspace";
    public const string Project = "Project";

    public static readonly string[] All = [Tenant, Workspace, Project];

    /// <summary>Returns canonical casing, or null if not a known level.</summary>
    public static string? TryNormalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return Project;

        foreach (var level in All)
        {
            if (string.Equals(value, level, StringComparison.OrdinalIgnoreCase))
                return level;
        }

        return null;
    }
}
