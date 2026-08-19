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

    public string? Endpoint
    {
        get;
        set;
    }

    public string? DeploymentName
    {
        get;
        set;
    }

    public string? ApiKey
    {
        get;
        set;
    }
}
