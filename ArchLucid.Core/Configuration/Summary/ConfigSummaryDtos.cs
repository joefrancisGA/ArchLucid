namespace ArchLucid.Core.Configuration.Summary;

/// <summary>Server response for <c>GET /v1/admin/config-summary</c> — presence; optional effective values (secrets redacted).</summary>
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

    /// <summary>
    ///     Populated only when <c>includeEffectiveValues=true</c> on <c>GET /v1/admin/config-summary</c>; secrets return
    ///     <c>***</c>.
    /// </summary>
    public string? EffectiveValue
    {
        get;
        set;
    }
}
