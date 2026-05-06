namespace ArchLucid.Persistence.Data.Infrastructure;

/// <summary>Classifies embedded DbUp script resource names into system vs tenant planes.</summary>
public static class SqlMigrationPlanes
{
    private const string BaselineToken = ".Migrations.Baseline.";

    public static bool IsSystemPlaneScript(string embeddedResourceName)
    {
        return !string.IsNullOrWhiteSpace(embeddedResourceName) && embeddedResourceName.Contains(".Migrations.System.", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsTenantPlaneScript(string embeddedResourceName)
    {
        if (string.IsNullOrWhiteSpace(embeddedResourceName)) return false;
        if (!embeddedResourceName.Contains(".Migrations.", StringComparison.OrdinalIgnoreCase)) return false;
        if (embeddedResourceName.Contains(BaselineToken, StringComparison.OrdinalIgnoreCase)) return false;

        return !IsSystemPlaneScript(embeddedResourceName);
    }
}
