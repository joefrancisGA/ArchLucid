using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Core.Configuration;

/// <summary>Configuration for the secondary/fallback LLM deployment.</summary>
public sealed class FallbackLlmOptions
{
    public const string SectionName = "ArchLucid:FallbackLlm";

    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Ordered regional / DR targets tried after the primary Azure OpenAI call fails (429 / 5xx).</summary>
    public List<FallbackLlmEndpointOptions>? Endpoints
    {
        get;
        set;
    }

    [Obsolete("Use ArchLucid:FallbackLlm:Endpoints[n]:Endpoint instead of the flat property.")]
    public string? Endpoint
    {
        get;
        set;
    }

    [Obsolete("Use ArchLucid:FallbackLlm:Endpoints[n]:DeploymentName instead of the flat property.")]
    public string? DeploymentName
    {
        get;
        set;
    }

    [Obsolete("Use ArchLucid:FallbackLlm:Endpoints[n]:ApiKey instead of the flat property.")]
    public string? ApiKey
    {
        get;
        set;
    }
}
