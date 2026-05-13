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



/// <summary>Server response for <c>GET /v1/admin/config-lint</c> — structured lint parity with CLI/advisor rules.</summary>

public sealed class AdminConfigLintResponse

{

    /// <summary><see cref="Microsoft.Extensions.Hosting.IHostEnvironment.EnvironmentName" /> used for evaluation.</summary>

    public string? HostingEnvironmentName

    {

        get;

        set;

    }



    /// <summary>True when <see cref="BlockingFindings" /> is empty.</summary>

    public bool Ok

    {

        get;

        set;

    }



    /// <summary>Production-profile / auth traps that align with <c>archlucid config lint</c> blocking output.</summary>

    public IReadOnlyList<AdminConfigLintFinding>? BlockingFindings

    {

        get;

        set;

    }



    /// <summary>Optional hosting advisor warnings (omitted when <c>includeAdvisory=false</c>).</summary>

    public IReadOnlyList<AdminConfigLintFinding>? AdvisoryFindings

    {

        get;

        set;

    }

}



/// <summary>Single lint row (stable rule name for automation).</summary>

public sealed class AdminConfigLintFinding

{

    public string? RuleName

    {

        get;

        set;

    }



    public string? Message

    {

        get;

        set;

    }

}


