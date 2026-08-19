namespace ArchLucid.Contracts.Integrations;

public sealed class ItsmAtlassianOAuthConsentStartResponse
{
    public required string AuthorizeUrl { get; init; }

    public required string State { get; init; }
}
