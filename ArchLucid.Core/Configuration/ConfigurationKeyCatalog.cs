namespace ArchLucid.Core.Configuration;

/// <summary>Operator-facing key registry (see <c>docs/library/CONFIGURATION_REFERENCE.md</c>). Paths use colon notation.</summary>
public static partial class ConfigurationKeyCatalog
{
    public static IReadOnlyList<ConfigurationKeyEntry> All
    {
        get;
    } = Build();

    private static IReadOnlyList<ConfigurationKeyEntry> Build()
    {
        List<ConfigurationKeyEntry> entries = new(178);
        AddHostingAndCore(entries);
        AddAgentExecution(entries);
        AddAuthenticationAndBilling(entries);
        AddDataRetentionAndEmail(entries);

        return entries.AsReadOnly();
    }

    /// <summary>CLI-only “keys” (env / archlucid.json) — excluded from the API <c>config-summary</c> list.</summary>
    public static IReadOnlyList<ConfigurationKeyEntry> CliLocalOnly
    {
        get;
    } = new List<ConfigurationKeyEntry>(4)
    {
        E("Environment", "ASPNETCORE_ENVIRONMENT", M("env", "launchSettings", "Service"), "(unset)", "—",
            "ASPNETCORE_ / DOTNET_ENVIRONMENT — cluster role for startup validation. Checked via environment variable, not appsettings path.",
            ConfigKeyRequirementKind.None),
        E("CLI", "ARCHLUCID_API_URL", M("env", "archlucid.json"), "http://localhost:5128 (default)",
            "When using the CLI", "Resolves the API base URL; not consumed by the API process.",
            ConfigKeyRequirementKind.None),
        E("CLI", "ARCHLUCID_API_KEY", M("env", "archlucid.json (optional)"), "empty",
            "If calling protected admin routes from CLI",
            "Maps to `X-Api-Key`; never shown by <c>config check</c>.", ConfigKeyRequirementKind.None),
    }.AsReadOnly();

    private static string[] M(params string[] s) => s;

    private static ConfigurationKeyEntry E(
        string section,
        string path,
        IReadOnlyList<string> src,
        string? def,
        string req,
        string desc,
        ConfigKeyRequirementKind r,
        ConfigurationKeyProductionProfileGuardKind productionProfileGuardKind = ConfigurationKeyProductionProfileGuardKind.None,
        ConfigurationKeyDeprecationKind deprecationKind = ConfigurationKeyDeprecationKind.None,
        string? deprecatedReplacementPath = null) =>
        new(section, path, src, def, req, desc, r, productionProfileGuardKind, deprecationKind, deprecatedReplacementPath);
}
