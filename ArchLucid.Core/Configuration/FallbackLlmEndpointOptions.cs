namespace ArchLucid.Core.Configuration;

/// <summary>One Azure OpenAI resource + deployment to try after the primary fails (429 / 5xx / outage).</summary>
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

    /// <summary>
    ///     When true, the fallback client uses the host managed identity (no API key). Required for hosted DR
    ///     where the primary Azure OpenAI path is also managed-identity.
    /// </summary>
    public bool UseManagedIdentity
    {
        get;
        set;
    }
}
