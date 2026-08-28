using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Core.Integrations.Itsm;

public static partial class TenantItsmConnectorConnectionUpsertValidation
{
    public static bool TryParseProvider(string? raw, out TenantItsmConnectorProvider provider, out string? errorMessage)
    {
        provider = default;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(raw))
        {
            errorMessage = ProviderRequiredMessage;

            return false;
        }

        if (raw.Trim().Equals("Jira", StringComparison.OrdinalIgnoreCase))
        {
            provider = TenantItsmConnectorProvider.Jira;

            return true;
        }

        if (raw.Trim().Equals("ServiceNow", StringComparison.OrdinalIgnoreCase))
        {
            provider = TenantItsmConnectorProvider.ServiceNow;

            return true;
        }

        if (raw.Trim().Equals("AzureBoards", StringComparison.OrdinalIgnoreCase) ||
            raw.Trim().Equals("Azure Boards", StringComparison.OrdinalIgnoreCase))
        {
            provider = TenantItsmConnectorProvider.AzureBoards;

            return true;
        }

        errorMessage = ProviderRequiredMessage;

        return false;
    }

    public static string ToProviderLabel(TenantItsmConnectorProvider provider) =>
        provider switch
        {
            TenantItsmConnectorProvider.Jira => "Jira",
            TenantItsmConnectorProvider.ServiceNow => "ServiceNow",
            TenantItsmConnectorProvider.AzureBoards => "Azure Boards",
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };

    public static string ToProviderPersistenceLabel(TenantItsmConnectorProvider provider) =>
        provider switch
        {
            TenantItsmConnectorProvider.Jira => "Jira",
            TenantItsmConnectorProvider.ServiceNow => "ServiceNow",
            TenantItsmConnectorProvider.AzureBoards => "AzureBoards",
            _ => throw new ArgumentOutOfRangeException(nameof(provider), provider, null)
        };

    public static bool TryParseAuthMode(string? raw, out ItsmConnectorAuthMode authMode, out string? errorMessage)
    {
        authMode = ItsmConnectorAuthMode.BasicApiToken;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(raw))
            return true;

        string trimmed = raw.Trim();

        if (trimmed.Equals("BasicApiToken", StringComparison.OrdinalIgnoreCase))
        {
            authMode = ItsmConnectorAuthMode.BasicApiToken;

            return true;
        }

        if (trimmed.Equals("OAuth2ClientCredentials", StringComparison.OrdinalIgnoreCase))
        {
            authMode = ItsmConnectorAuthMode.OAuth2ClientCredentials;

            return true;
        }

        if (trimmed.Equals("OAuth2RefreshToken", StringComparison.OrdinalIgnoreCase))
        {
            authMode = ItsmConnectorAuthMode.OAuth2RefreshToken;

            return true;
        }

        errorMessage = AuthModeInvalidMessage;

        return false;
    }

    public static string ToAuthModeLabel(ItsmConnectorAuthMode authMode) =>
        authMode switch
        {
            ItsmConnectorAuthMode.BasicApiToken => "BasicApiToken",
            ItsmConnectorAuthMode.OAuth2ClientCredentials => "OAuth2ClientCredentials",
            ItsmConnectorAuthMode.OAuth2RefreshToken => "OAuth2RefreshToken",
            _ => throw new ArgumentOutOfRangeException(nameof(authMode), authMode, null)
        };

    public static bool TryParseAuthModeLabel(string? raw, out ItsmConnectorAuthMode authMode)
    {
        if (!TryParseAuthMode(raw, out authMode, out _))
        {
            authMode = ItsmConnectorAuthMode.BasicApiToken;

            return false;
        }

        return true;
    }
}
