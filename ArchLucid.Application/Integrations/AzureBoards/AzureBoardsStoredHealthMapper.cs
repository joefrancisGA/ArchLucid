using ArchLucid.Core.Persistence.ApplicationPorts.Integrations;

namespace ArchLucid.Application.Integrations.AzureBoards;

/// <summary>Maps connector + last test rows to stored health without outbound HTTP.</summary>
public static class AzureBoardsStoredHealthMapper
{
    public static bool AreCredentialsConfigured(TenantItsmConnectorConnectionRecord? connection)
    {
        if (connection is null)
        {
            return false;
        }

        return !string.IsNullOrWhiteSpace(connection.InstanceBaseUrl)
            && !string.IsNullOrWhiteSpace(connection.CredentialKeyVaultSecretName);
    }

    public static AzureBoardsStoredHealth Map(
        bool credentialsConfigured,
        TenantAzureBoardsOutboundSettings? settings)
    {
        bool? lastTestOk = AzureBoardsLastConnectionTestInterpreter.TryInterpret(
            settings?.LastConnectionTestUtc,
            settings?.LastConnectionTestSummary);

        string summary = settings?.LastConnectionTestSummary?.Trim() ?? string.Empty;

        if (lastTestOk == true)
        {
            return new AzureBoardsStoredHealth(
                AzureBoardsStoredHealthStatuses.Healthy,
                true,
                summary,
                null);
        }

        if (lastTestOk == false)
        {
            return new AzureBoardsStoredHealth(
                AzureBoardsStoredHealthStatuses.Unhealthy,
                false,
                summary.Length > 0 ? summary : "Azure Boards connection test failed.",
                null);
        }

        if (!credentialsConfigured)
        {
            return new AzureBoardsStoredHealth(
                AzureBoardsStoredHealthStatuses.NotConfigured,
                false,
                "Azure Boards connector credentials are not configured.",
                null);
        }

        return new AzureBoardsStoredHealth(
            AzureBoardsStoredHealthStatuses.NotTested,
            false,
            "Connection settings are saved but have not been validated yet.",
            null);
    }
}
