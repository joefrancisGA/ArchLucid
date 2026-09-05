namespace ArchLucid.Core.Configuration;

/// <summary>One validated fallback Azure OpenAI target after configuration resolution.</summary>
public sealed class FallbackLlmResolvedEndpoint
{
    public required string Endpoint
    {
        get;
        init;
    }

    public required string DeploymentName
    {
        get;
        init;
    }

    /// <summary>API key when <see cref="UseManagedIdentity"/> is false; empty otherwise.</summary>
    public string ApiKey
    {
        get;
        init;
    } = string.Empty;

    public bool UseManagedIdentity
    {
        get;
        init;
    }
}
