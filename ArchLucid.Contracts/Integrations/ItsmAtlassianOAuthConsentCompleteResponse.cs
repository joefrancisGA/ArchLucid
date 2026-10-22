namespace ArchLucid.Contracts.Integrations;

public sealed class ItsmAtlassianOAuthConsentCompleteResponse
{
    public bool RefreshTokenStored { get; init; }

    public TenantItsmConnectorConnectionResponse? Connection { get; init; }
}
