namespace ArchLucid.Contracts.Integrations;

public sealed class ItsmAtlassianOAuthConsentCompleteRequest
{
    public required string Code { get; init; }

    public required string State { get; init; }
}
