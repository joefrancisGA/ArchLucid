namespace ArchLucid.Core.Integrations.Itsm;

/// <summary>Outbound authentication mode for first-party ITSM connector rows (TB-600).</summary>
public enum ItsmConnectorAuthMode
{
  BasicApiToken = 0,
  OAuth2ClientCredentials = 1,
  OAuth2RefreshToken = 2
}
