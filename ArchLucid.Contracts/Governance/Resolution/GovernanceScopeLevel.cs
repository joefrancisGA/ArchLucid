namespace ArchLucid.Contracts.Governance.Resolution;

/// <summary>Canonical string constants for policy-pack assignment scope levels.</summary>
public static class GovernanceScopeLevel
{
    public const string Tenant = "Tenant";

    public const string Workspace = "Workspace";

    public const string Project = "Project";

    public static readonly string[] All = [Tenant, Workspace, Project];

    public static string? TryNormalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? Project
            : All.FirstOrDefault(level => string.Equals(value, level, StringComparison.OrdinalIgnoreCase));
    }
}
