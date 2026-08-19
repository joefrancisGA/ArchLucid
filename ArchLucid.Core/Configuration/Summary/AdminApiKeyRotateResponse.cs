namespace ArchLucid.Core.Configuration.Summary;

public sealed class AdminApiKeyRotateResponse
{
    public string Slot { get; set; } = "Admin";

    public string ConfigPath { get; set; } = "";

    /// <summary>New key material — shown once; never stored or logged server-side after the response.</summary>
    public string PlaintextKey { get; set; } = "";

    /// <summary>Operator instruction: <c>Replace</c> entire config value, or <c>Append</c> suffix to existing material.</summary>
    public string DeploymentAction { get; set; } = "Replace";

    /// <summary>Value to set when <see cref="DeploymentAction" /> is <c>Replace</c>.</summary>
    public string? ReplaceConfigValue { get; set; }

    /// <summary>Suffix to append (includes leading comma) when <see cref="DeploymentAction" /> is <c>Append</c>.</summary>
    public string? AppendConfigSuffix { get; set; }
}
