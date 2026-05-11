namespace ArchLucid.Core.Configuration.Summary;

/// <summary>Server response for admin configuration summary routes — presence; optional effective values (secrets redacted).</summary>
public sealed class AdminConfigSummaryResponse
{
    public IReadOnlyList<ConfigSummaryKeyRow>? Keys
    {
        get;
        set;
    }
}

public sealed class ConfigSummaryKeyRow
{
    /// <summary>Catalog section (e.g. Hosting, ArchLucid).</summary>
    public string? Section
    {
        get;
        set;
    }

    public string? ConfigPath
    {
        get;
        set;
    }

    public bool IsSet
    {
        get;
        set;
    }

    /// <summary><see cref="ConfigKeyRequirementKind" /> name from the catalog.</summary>
    public string? RequirementKind
    {
        get;
        set;
    }

    /// <summary>Operator-facing description from <see cref="ArchLucid.Core.Configuration.ConfigurationKeyCatalog" />.</summary>
    public string? Description
    {
        get;
        set;
    }

    /// <summary>Declared sources for the key (e.g. appsettings, env, Key Vault), from the catalog.</summary>
    public IReadOnlyList<string>? Sources
    {
        get;
        set;
    }

    /// <summary>
    ///     Populated only when <c>includeEffectiveValues=true</c>; sensitive values return <c>***</c> per
    ///     <see cref="ConfigurationEffectiveValueResolver" />.
    /// </summary>
    public string? EffectiveValue
    {
        get;
        set;
    }
}
