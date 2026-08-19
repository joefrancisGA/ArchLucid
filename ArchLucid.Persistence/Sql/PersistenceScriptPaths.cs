using System.Reflection;

namespace ArchLucid.Persistence.Sql;

/// <summary>Resolves consolidated DDL script paths copied beside <see cref="Assembly" /> output.</summary>
public static class PersistenceScriptPaths
{
    private const string ScriptsFolderName = "Scripts";
    private const string TenantScriptFileName = "ArchLucid.sql";
    private const string SystemScriptFileName = "ArchLucid.System.sql";

    public static string ResolveTenantScriptPath()
    {
        return ResolveScriptPath(TenantScriptFileName);
    }

    public static string ResolveSystemScriptPath()
    {
        return ResolveScriptPath(SystemScriptFileName);
    }

    private static string ResolveScriptPath(string fileName)
    {
        Assembly persistenceAssembly = typeof(SqlSchemaBootstrapper).Assembly;
        string dir = Path.GetDirectoryName(persistenceAssembly.Location) ?? AppContext.BaseDirectory;

        return Path.Combine(dir, ScriptsFolderName, fileName);
    }
}
