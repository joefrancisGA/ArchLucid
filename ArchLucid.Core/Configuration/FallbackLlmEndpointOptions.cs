namespace ArchLucid.Core.Configuration;

/// <summary>One Azure OpenAI resource + deployment to try after the primary fails (429 / 5xx / throttling).</summary>
public sealed class FallbackLlmEndpointOptions
{
    public string? Endpoint
    {
        get;
        set;
    }

    public string? ApiKey
    {
        get;
        set;
    }

    public string? DeploymentName
    {
        get;
        set;
    }
}
