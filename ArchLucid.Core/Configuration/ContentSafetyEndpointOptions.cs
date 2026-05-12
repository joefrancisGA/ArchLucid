namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional additional Content Safety endpoint bindings (DR / secondary region). Reserved for future SDK routing;
///     current guards use <see cref="ContentSafetyOptions.Endpoint" /> only.
/// </summary>
public sealed class ContentSafetyEndpointOptions
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
}
