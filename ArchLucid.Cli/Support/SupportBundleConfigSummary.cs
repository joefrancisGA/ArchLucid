using System.Text.Json.Serialization;

namespace ArchLucid.Cli.Support;

public sealed class SupportBundleConfigSummary
{
    [JsonPropertyName("hasArchlucidJson")]
    public bool HasArchlucidJson
    {
        get;
        init;
    }

    [JsonPropertyName("projectName")]
    public string? ProjectName
    {
        get;
        init;
    }

    [JsonPropertyName("schemaVersion")]
    public string? SchemaVersion
    {
        get;
        init;
    }

    [JsonPropertyName("apiBaseUrlRedacted")]
    public string ApiBaseUrlRedacted
    {
        get;
        init;
    } = string.Empty;

    [JsonPropertyName("inputsBriefPath")]
    public string? InputsBriefPath
    {
        get;
        init;
    }

    [JsonPropertyName("outputsLocalCacheDir")]
    public string? OutputsLocalCacheDir
    {
        get;
        init;
    }

    [JsonPropertyName("pluginsLockFile")]
    public string? PluginsLockFile
    {
        get;
        init;
    }

    [JsonPropertyName("terraformEnabled")]
    public bool? TerraformEnabled
    {
        get;
        init;
    }

    [JsonPropertyName("terraformPath")]
    public string? TerraformPath
    {
        get;
        init;
    }

    [JsonPropertyName("architecture")]
    public ArchLucidProjectScaffolder.ArchitectureSection? Architecture
    {
        get;
        init;
    }

    /// <summary>Effective <c>ArchLucid:StorageProvider</c> (secrets never included).</summary>
    [JsonPropertyName("storageProviderSummary")]
    public string StorageProviderSummary
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Effective <c>ArchLucidAuth:Mode</c> label (never includes keys or tokens).</summary>
    [JsonPropertyName("hostAuthModeSummary")]
    public string HostAuthModeSummary
    {
        get;
        init;
    } = string.Empty;

    /// <summary>Whether <c>ARCHLUCID_API_KEY</c> is set for outbound CLI calls (value never serialized).</summary>
    [JsonPropertyName("cliOutboundApiKeyEnvironmentPresent")]
    public bool CliOutboundApiKeyEnvironmentPresent
    {
        get;
        init;
    }

    /// <summary>Config validation warnings and errors only (category + check), aligned with <c>validate-config</c>.</summary>
    [JsonPropertyName("validateConfigAlerts")]
    public IReadOnlyList<SupportBundleValidateConfigAlert> ValidateConfigAlerts
    {
        get;
        init;
    } = [];
}
